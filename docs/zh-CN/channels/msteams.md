---
read_when:
    - 开发 Microsoft Teams 渠道功能
summary: Microsoft Teams 机器人的支持状态、能力与配置
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-05T08:17:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99fc6e136893ec65dc85d3bc0c0d92134069a2f3b8cb4fcf66c14674399b3eaf
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> “进入此地者，放弃一切希望吧。”

更新日期：2026-01-21

状态：支持文本和私信附件；渠道/群组文件发送需要 `sharePointSiteId` + Graph 权限（请参见[在群聊中发送文件](#sending-files-in-group-chats)）。投票通过 Adaptive Cards 发送。消息操作提供显式的 `upload-file`，用于优先发送文件。

## 内置插件

Microsoft Teams 在当前 OpenClaw 版本中作为内置插件提供，因此在普通打包构建中
无需单独安装。

如果你使用的是较旧版本，或是排除了内置 Teams 的自定义安装，
请手动安装：

```bash
openclaw plugins install @openclaw/msteams
```

本地检出安装（从 git 仓库运行时）：

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

详情请参见：[插件](/tools/plugin)

## 快速设置（入门）

1. 确保 Microsoft Teams 插件可用。
   - 当前打包的 OpenClaw 版本已内置该插件。
   - 较旧/自定义安装可使用上述命令手动添加。
2. 创建一个 **Azure Bot**（App ID + client secret + tenant ID）。
3. 使用这些凭证配置 OpenClaw。
4. 通过公开 URL 或隧道暴露 `/api/messages`（默认端口 3978）。
5. 安装 Teams 应用包并启动 Gateway 网关。

最小配置：

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

注意：群聊默认被阻止（`channels.msteams.groupPolicy: "allowlist"`）。要允许群组回复，请设置 `channels.msteams.groupAllowFrom`（或使用 `groupPolicy: "open"` 允许任何成员，但默认仍受提及门控限制）。

## 目标

- 通过 Teams 私信、群聊或渠道与 OpenClaw 交互。
- 保持路由确定性：回复始终返回到其来源渠道。
- 默认采用安全的渠道行为（除非另行配置，否则需要提及）。

## 配置写入

默认情况下，Microsoft Teams 允许写入由 `/config set|unset` 触发的配置更新（需要 `commands.config: true`）。

禁用方式：

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## 访问控制（私信 + 群组）

**私信访问**

- 默认值：`channels.msteams.dmPolicy = "pairing"`。未知发送者在获批前会被忽略。
- `channels.msteams.allowFrom` 应使用稳定的 AAD 对象 ID。
- UPN/显示名称是可变的；默认禁用直接匹配，只有启用 `channels.msteams.dangerouslyAllowNameMatching: true` 后才会启用。
- 当凭证允许时，向导可通过 Microsoft Graph 将名称解析为 ID。

**群组访问**

- 默认值：`channels.msteams.groupPolicy = "allowlist"`（除非你添加 `groupAllowFrom`，否则会被阻止）。未设置时，可使用 `channels.defaults.groupPolicy` 覆盖默认值。
- `channels.msteams.groupAllowFrom` 控制哪些发送者可以在群聊/渠道中触发（回退到 `channels.msteams.allowFrom`）。
- 设置 `groupPolicy: "open"` 可允许任何成员（默认仍受提及门控限制）。
- 若要**不允许任何渠道**，请设置 `channels.msteams.groupPolicy: "disabled"`。

示例：

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"],
    },
  },
}
```

**Teams + 渠道 allowlist**

- 通过在 `channels.msteams.teams` 下列出团队和渠道来限定群组/渠道回复范围。
- 键应使用稳定的团队 ID 和渠道会话 ID。
- 当 `groupPolicy="allowlist"` 且存在团队 allowlist 时，仅接受已列出的团队/渠道（受提及门控限制）。
- 配置向导接受 `Team/Channel` 条目，并会帮你保存。
- 启动时，只要 Graph 权限允许，OpenClaw 就会将团队/渠道以及用户 allowlist 名称解析为 ID，
  并记录映射；未解析的团队/渠道名称会按原样保留，但默认不会用于路由，除非启用 `channels.msteams.dangerouslyAllowNameMatching: true`。

示例：

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            General: { requireMention: true },
          },
        },
      },
    },
  },
}
```

## 工作原理

1. 确保 Microsoft Teams 插件可用。
   - 当前打包的 OpenClaw 版本已内置该插件。
   - 较旧/自定义安装可使用上述命令手动添加。
2. 创建一个 **Azure Bot**（App ID + secret + tenant ID）。
3. 构建一个**Teams 应用包**，引用该机器人并包含下方的 RSC 权限。
4. 将 Teams 应用上传/安装到团队中（或安装到个人范围用于私信）。
5. 在 `~/.openclaw/openclaw.json`（或环境变量）中配置 `msteams` 并启动 Gateway 网关。
6. 默认情况下，Gateway 网关会在 `/api/messages` 上监听 Bot Framework webhook 流量。

## Azure Bot 设置（前提条件）

在配置 OpenClaw 之前，你需要创建一个 Azure Bot 资源。

### 第 1 步：创建 Azure Bot

1. 前往 [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. 填写 **Basics** 选项卡：

   | 字段 | 值 |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle** | 你的机器人名称，例如 `openclaw-msteams`（必须唯一） |
   | **Subscription** | 选择你的 Azure 订阅 |
   | **Resource group** | 新建或使用现有资源组 |
   | **Pricing tier** | 开发/测试请选择 **Free** |
   | **Type of App** | **Single Tenant**（推荐 - 请参见下方说明） |
   | **Creation type** | **Create new Microsoft App ID** |

> **弃用通知：** 自 2025-07-31 之后，新建多租户机器人已被弃用。新机器人请使用 **Single Tenant**。

3. 点击 **Review + create** → **Create**（等待约 1 到 2 分钟）

### 第 2 步：获取凭证

1. 前往你的 Azure Bot 资源 → **Configuration**
2. 复制 **Microsoft App ID** → 这就是你的 `appId`
3. 点击 **Manage Password** → 进入 App Registration
4. 在 **Certificates & secrets** 下点击 **New client secret** → 复制 **Value** → 这就是你的 `appPassword`
5. 前往 **Overview** → 复制 **Directory (tenant) ID** → 这就是你的 `tenantId`

### 第 3 步：配置 Messaging Endpoint

1. 在 Azure Bot 中打开 **Configuration**
2. 将 **Messaging endpoint** 设置为你的 webhook URL：
   - 生产环境：`https://your-domain.com/api/messages`
   - 本地开发：使用隧道（请参见下方的[本地开发](#local-development-tunneling)）

### 第 4 步：启用 Teams 渠道

1. 在 Azure Bot 中打开 **Channels**
2. 点击 **Microsoft Teams** → Configure → Save
3. 接受服务条款

## 本地开发（隧道）

Teams 无法访问 `localhost`。本地开发请使用隧道：

**选项 A：ngrok**

```bash
ngrok http 3978
# 复制 https URL，例如 https://abc123.ngrok.io
# 将 messaging endpoint 设置为：https://abc123.ngrok.io/api/messages
```

**选项 B：Tailscale Funnel**

```bash
tailscale funnel 3978
# 使用你的 Tailscale funnel URL 作为 messaging endpoint
```

## Teams Developer Portal（替代方式）

除了手动创建 manifest ZIP 外，你也可以使用 [Teams Developer Portal](https://dev.teams.microsoft.com/apps)：

1. 点击 **+ New app**
2. 填写基本信息（名称、描述、开发者信息）
3. 前往 **App features** → **Bot**
4. 选择 **Enter a bot ID manually** 并粘贴你的 Azure Bot App ID
5. 勾选范围：**Personal**、**Team**、**Group Chat**
6. 点击 **Distribute** → **Download app package**
7. 在 Teams 中：**Apps** → **Manage your apps** → **Upload a custom app** → 选择该 ZIP

这通常比手动编辑 JSON manifest 更容易。

## 测试机器人

**选项 A：Azure Web Chat（先验证 webhook）**

1. 在 Azure Portal 中进入你的 Azure Bot 资源 → **Test in Web Chat**
2. 发送一条消息 - 你应该会看到回复
3. 这可以在配置 Teams 之前确认你的 webhook endpoint 正常工作

**选项 B：Teams（应用安装后）**

1. 安装 Teams 应用（侧载或组织目录）
2. 在 Teams 中找到机器人并发送私信
3. 检查 Gateway 网关日志中的传入活动

## 设置（最小纯文本模式）

1. **确保 Microsoft Teams 插件可用**
   - 当前打包的 OpenClaw 版本已内置该插件。
   - 较旧/自定义安装可手动添加：
     - 从 npm：`openclaw plugins install @openclaw/msteams`
     - 从本地检出：`openclaw plugins install ./path/to/local/msteams-plugin`

2. **机器人注册**
   - 创建一个 Azure Bot（见上文），并记录：
     - App ID
     - Client secret（App password）
     - Tenant ID（单租户）

3. **Teams 应用 manifest**
   - 包含一个 `bot` 条目，其中 `botId = <App ID>`。
   - 范围：`personal`、`team`、`groupChat`。
   - `supportsFiles: true`（个人范围的文件处理必需）。
   - 添加 RSC 权限（见下文）。
   - 创建图标：`outline.png`（32x32）和 `color.png`（192x192）。
   - 将三个文件一起打包成 ZIP：`manifest.json`、`outline.png`、`color.png`。

4. **配置 OpenClaw**

   ```json5
   {
     channels: {
       msteams: {
         enabled: true,
         appId: "<APP_ID>",
         appPassword: "<APP_PASSWORD>",
         tenantId: "<TENANT_ID>",
         webhook: { port: 3978, path: "/api/messages" },
       },
     },
   }
   ```

   你也可以使用环境变量代替配置键：
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`

5. **机器人 endpoint**
   - 将 Azure Bot Messaging Endpoint 设置为：
     - `https://<host>:3978/api/messages`（或你自定义的路径/端口）。

6. **运行 Gateway 网关**
   - 当内置或手动安装的插件可用，且存在带凭证的 `msteams` 配置时，Teams 渠道会自动启动。

## 成员信息操作

OpenClaw 为 Microsoft Teams 提供了基于 Graph 的 `member-info` 操作，因此智能体和自动化可以直接通过 Microsoft Graph 解析渠道成员详细信息（显示名称、邮箱、角色）。

要求：

- `Member.Read.Group` RSC 权限（已包含在推荐的 manifest 中）
- 对于跨团队查找：具有管理员同意的 `User.Read.All` Graph 应用权限

该操作由 `channels.msteams.actions.memberInfo` 控制（默认：当 Graph 凭证可用时启用）。

## 历史上下文

- `channels.msteams.historyLimit` 控制有多少最近的渠道/群组消息会被包装进提示词中。
- 回退到 `messages.groupChat.historyLimit`。设置为 `0` 可禁用（默认 50）。
- 获取的线程历史会按发送者 allowlist（`allowFrom` / `groupAllowFrom`）过滤，因此线程上下文预填充目前仅包含允许发送者的消息。
- 引用的附件上下文（从 Teams 回复 HTML 派生的 `ReplyTo*`）当前会按接收内容原样传递。
- 换句话说，allowlist 会控制谁可以触发智能体；而目前只有特定的补充上下文路径会被过滤。
- 私信历史可通过 `channels.msteams.dmHistoryLimit`（用户轮次）限制。按用户覆盖：`channels.msteams.dms["<user_id>"].historyLimit`。

## 当前 Teams RSC 权限（Manifest）

这些是我们 Teams 应用 manifest 中**现有的 resourceSpecific 权限**。它们只在安装该应用的团队/聊天中生效。

**用于渠道（团队范围）：**

- `ChannelMessage.Read.Group`（Application）- 接收所有渠道消息，无需 @ 提及
- `ChannelMessage.Send.Group`（Application）
- `Member.Read.Group`（Application）
- `Owner.Read.Group`（Application）
- `ChannelSettings.Read.Group`（Application）
- `TeamMember.Read.Group`（Application）
- `TeamSettings.Read.Group`（Application）

**用于群聊：**

- `ChatMessage.Read.Chat`（Application）- 接收所有群聊消息，无需 @ 提及

## Teams Manifest 示例（已脱敏）

包含必需字段的最小有效示例。请替换其中的 ID 和 URL。

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Your Org",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw in Teams", full: "OpenClaw in Teams" },
  icons: { outline: "outline.png", color: "color.png" },
  accentColor: "#5B6DEF",
  bots: [
    {
      botId: "11111111-1111-1111-1111-111111111111",
      scopes: ["personal", "team", "groupChat"],
      isNotificationOnly: false,
      supportsCalling: false,
      supportsVideo: false,
      supportsFiles: true,
    },
  ],
  webApplicationInfo: {
    id: "11111111-1111-1111-1111-111111111111",
  },
  authorization: {
    permissions: {
      resourceSpecific: [
        { name: "ChannelMessage.Read.Group", type: "Application" },
        { name: "ChannelMessage.Send.Group", type: "Application" },
        { name: "Member.Read.Group", type: "Application" },
        { name: "Owner.Read.Group", type: "Application" },
        { name: "ChannelSettings.Read.Group", type: "Application" },
        { name: "TeamMember.Read.Group", type: "Application" },
        { name: "TeamSettings.Read.Group", type: "Application" },
        { name: "ChatMessage.Read.Chat", type: "Application" },
      ],
    },
  },
}
```

### Manifest 注意事项（必备字段）

- `bots[].botId` **必须**与 Azure Bot App ID 一致。
- `webApplicationInfo.id` **必须**与 Azure Bot App ID 一致。
- `bots[].scopes` 必须包含你计划使用的界面（`personal`、`team`、`groupChat`）。
- `bots[].supportsFiles: true` 是个人范围文件处理所必需的。
- 如果你想接收渠道流量，`authorization.permissions.resourceSpecific` 必须包含渠道读取/发送权限。

### 更新现有应用

要更新已安装的 Teams 应用（例如添加 RSC 权限）：

1. 用新设置更新你的 `manifest.json`
2. **递增 `version` 字段**（例如 `1.0.0` → `1.1.0`）
3. **重新打包 ZIP**，包含 manifest 和图标（`manifest.json`、`outline.png`、`color.png`）
4. 上传新 ZIP：
   - **选项 A（Teams Admin Center）：** Teams Admin Center → Teams apps → Manage apps → 找到你的应用 → Upload new version
   - **选项 B（侧载）：** 在 Teams 中 → Apps → Manage your apps → Upload a custom app
5. **对于团队渠道：** 在每个团队中重新安装该应用，以使新权限生效
6. **完全退出并重新启动 Teams**（而不只是关闭窗口），以清除缓存的应用元数据

## 能力：仅 RSC 与 Graph 的区别

### 仅使用 **Teams RSC**（已安装应用，无 Graph API 权限）

可用：

- 读取渠道消息**文本**内容。
- 发送渠道消息**文本**内容。
- 接收**个人私信**文件附件。

不可用：

- 渠道/群组**图片或文件内容**（负载仅包含 HTML 占位内容）。
- 下载存储在 SharePoint/OneDrive 中的附件。
- 读取消息历史（超出实时 webhook 事件的部分）。

### 使用 **Teams RSC + Microsoft Graph 应用权限**

新增能力：

- 下载托管内容（粘贴到消息中的图片）。
- 下载存储在 SharePoint/OneDrive 中的文件附件。
- 通过 Graph 读取渠道/聊天消息历史。

### RSC 与 Graph API

| 能力 | RSC 权限 | Graph API |
| ----------------------- | -------------------- | ----------------------------------- |
| **实时消息** | 是（通过 webhook） | 否（仅轮询） |
| **历史消息** | 否 | 是（可查询历史） |
| **设置复杂度** | 仅应用 manifest | 需要管理员同意 + token 流程 |
| **离线可用** | 否（必须在线运行） | 是（可随时查询） |

**结论：** RSC 用于实时监听；Graph API 用于历史访问。如果要在离线期间补上错过的消息，你需要具有 `ChannelMessage.Read.All` 的 Graph API（需要管理员同意）。

## 启用 Graph 的媒体 + 历史（渠道必需）

如果你需要在**渠道**中处理图片/文件，或想获取**消息历史**，则必须启用 Microsoft Graph 权限并授予管理员同意。

1. 在 Entra ID（Azure AD）**App Registration** 中，添加 Microsoft Graph **Application permissions**：
   - `ChannelMessage.Read.All`（渠道附件 + 历史）
   - `Chat.Read.All` 或 `ChatMessage.Read.All`（群聊）
2. **为租户授予管理员同意**。
3. 递增 Teams 应用 **manifest version**，重新上传，并**在 Teams 中重新安装该应用**。
4. **完全退出并重新启动 Teams**，以清除缓存的应用元数据。

**用户提及的额外权限：** 对于当前会话中的用户，用户 @ 提及可直接使用。但是，如果你希望动态搜索并提及**不在当前会话中**的用户，请添加 `User.Read.All`（Application）权限并授予管理员同意。

## 已知限制

### Webhook 超时

Teams 通过 HTTP webhook 传递消息。如果处理耗时过长（例如 LLM 响应较慢），你可能会看到：

- Gateway 网关超时
- Teams 重试消息（导致重复）
- 回复丢失

OpenClaw 通过快速返回并主动发送回复来处理此问题，但极慢的响应仍可能导致问题。

### 格式化

Teams 的 Markdown 比 Slack 或 Discord 更受限制：

- 基本格式可用：**粗体**、_斜体_、`code`、链接
- 复杂 Markdown（表格、嵌套列表）可能无法正确渲染
- 支持用于投票和任意卡片发送的 Adaptive Cards（见下文）

## 配置

关键设置（共享渠道模式请参见 `/gateway/configuration`）：

- `channels.msteams.enabled`：启用/禁用该渠道。
- `channels.msteams.appId`、`channels.msteams.appPassword`、`channels.msteams.tenantId`：机器人凭证。
- `channels.msteams.webhook.port`（默认 `3978`）
- `channels.msteams.webhook.path`（默认 `/api/messages`）
- `channels.msteams.dmPolicy`：`pairing | allowlist | open | disabled`（默认：pairing）
- `channels.msteams.allowFrom`：私信 allowlist（推荐使用 AAD 对象 ID）。当 Graph 访问可用时，向导会在设置期间将名称解析为 ID。
- `channels.msteams.dangerouslyAllowNameMatching`：紧急开关，用于重新启用可变 UPN/显示名称匹配以及直接团队/渠道名称路由。
- `channels.msteams.textChunkLimit`：传出文本分块大小。
- `channels.msteams.chunkMode`：`length`（默认）或 `newline`，后者会先按空行（段落边界）拆分，再按长度分块。
- `channels.msteams.mediaAllowHosts`：传入附件主机的 allowlist（默认是 Microsoft/Teams 域名）。
- `channels.msteams.mediaAuthAllowHosts`：媒体重试时允许附加 Authorization 请求头的主机 allowlist（默认是 Graph + Bot Framework 主机）。
- `channels.msteams.requireMention`：在渠道/群组中要求 @ 提及（默认 true）。
- `channels.msteams.replyStyle`：`thread | top-level`（请参见[回复样式](#reply-style-threads-vs-posts)）。
- `channels.msteams.teams.<teamId>.replyStyle`：按团队覆盖。
- `channels.msteams.teams.<teamId>.requireMention`：按团队覆盖。
- `channels.msteams.teams.<teamId>.tools`：按团队的默认工具策略覆盖（`allow`/`deny`/`alsoAllow`），在缺少渠道覆盖时使用。
- `channels.msteams.teams.<teamId>.toolsBySender`：按团队、按发送者的默认工具策略覆盖（支持 `"*"` 通配符）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`：按渠道覆盖。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`：按渠道覆盖。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`：按渠道的工具策略覆盖（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`：按渠道、按发送者的工具策略覆盖（支持 `"*"` 通配符）。
- `toolsBySender` 键应使用显式前缀：
  `id:`、`e164:`、`username:`、`name:`（旧版无前缀键仍只会映射到 `id:`）。
- `channels.msteams.actions.memberInfo`：启用或禁用基于 Graph 的成员信息操作（默认：当 Graph 凭证可用时启用）。
- `channels.msteams.sharePointSiteId`：用于群聊/渠道文件上传的 SharePoint 站点 ID（请参见[在群聊中发送文件](#sending-files-in-group-chats)）。

## 路由与会话

- 会话键遵循标准智能体格式（请参见 [/concepts/session](/concepts/session)）：
  - 私信共享主会话（`agent:<agentId>:<mainKey>`）。
  - 渠道/群组消息使用 conversation id：
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 回复样式：线程与帖子

Teams 最近在相同底层数据模型之上引入了两种渠道 UI 样式：

| 样式 | 描述 | 推荐的 `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts**（经典） | 消息显示为卡片，下方附带线程回复 | `thread`（默认） |
| **Threads**（类似 Slack） | 消息线性流动，更像 Slack | `top-level` |

**问题在于：** Teams API 不会暴露某个渠道使用的是哪种 UI 样式。如果使用了错误的 `replyStyle`：

- 在 Threads 样式的渠道中使用 `thread` → 回复会以不自然的嵌套方式显示
- 在 Posts 样式的渠道中使用 `top-level` → 回复会作为独立的顶级帖子显示，而不是在线程内

**解决方案：** 根据渠道的实际设置按渠道配置 `replyStyle`：

```json5
{
  channels: {
    msteams: {
      replyStyle: "thread",
      teams: {
        "19:abc...@thread.tacv2": {
          channels: {
            "19:xyz...@thread.tacv2": {
              replyStyle: "top-level",
            },
          },
        },
      },
    },
  },
}
```

## 附件与图片

**当前限制：**

- **私信：** 图片和文件附件可通过 Teams 机器人文件 API 正常工作。
- **渠道/群组：** 附件位于 M365 存储（SharePoint/OneDrive）中。Webhook 负载只包含 HTML 占位内容，不包含真实文件字节。**下载渠道附件需要 Graph API 权限**。
- 对于显式的优先发送文件场景，请使用 `action=upload-file`，并传入 `media` / `filePath` / `path`；可选的 `message` 会作为附带文本/评论，`filename` 会覆盖上传名称。

如果没有 Graph 权限，带图片的渠道消息将仅以文本形式接收（机器人无法访问图片内容）。
默认情况下，OpenClaw 只会从 Microsoft/Teams 主机名下载媒体。可使用 `channels.msteams.mediaAllowHosts` 覆盖（使用 `["*"]` 可允许任意主机）。
Authorization 请求头仅会附加到 `channels.msteams.mediaAuthAllowHosts` 中的主机（默认是 Graph + Bot Framework 主机）。请保持该列表严格（避免使用多租户后缀）。

## 在群聊中发送文件

机器人可以在私信中使用 FileConsentCard 流程发送文件（内置支持）。但是，**在群聊/渠道中发送文件**需要额外设置：

| 上下文 | 文件发送方式 | 所需设置 |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **私信** | FileConsentCard → 用户接受 → 机器人上传 | 开箱即用 |
| **群聊/渠道** | 上传到 SharePoint → 分享链接 | 需要 `sharePointSiteId` + Graph 权限 |
| **图片（任何上下文）** | Base64 编码内联 | 开箱即用 |

### 为什么群聊需要 SharePoint

机器人没有个人 OneDrive 驱动器（`/me/drive` Graph API endpoint 不适用于应用身份）。要在群聊/渠道中发送文件，机器人需要上传到一个 **SharePoint 站点** 并创建共享链接。

### 设置

1. 在 Entra ID（Azure AD）→ App Registration 中添加 **Graph API 权限**：
   - `Sites.ReadWrite.All`（Application）- 上传文件到 SharePoint
   - `Chat.Read.All`（Application）- 可选，用于启用按用户的共享链接

2. **为租户授予管理员同意**。

3. **获取你的 SharePoint 站点 ID：**

   ```bash
   # 通过 Graph Explorer 或使用有效 token 的 curl：
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # 示例：对于位于 "contoso.sharepoint.com/sites/BotFiles" 的站点
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # 响应中包含："id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **配置 OpenClaw：**

   ```json5
   {
     channels: {
       msteams: {
         // ... other config ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### 共享行为

| 权限 | 共享行为 |
| --------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` only | 面向整个组织的共享链接（组织内任何人都可访问） |
| `Sites.ReadWrite.All` + `Chat.Read.All` | 按用户的共享链接（仅聊天成员可访问） |

按用户共享更安全，因为只有聊天参与者可以访问文件。如果缺少 `Chat.Read.All` 权限，机器人会回退到组织范围共享。

### 回退行为

| 场景 | 结果 |
| ------------------------------------------------- | -------------------------------------------------- |
| 群聊 + 文件 + 已配置 `sharePointSiteId` | 上传到 SharePoint，发送共享链接 |
| 群聊 + 文件 + 未配置 `sharePointSiteId` | 尝试上传到 OneDrive（可能失败），仅发送文本 |
| 个人聊天 + 文件 | FileConsentCard 流程（无需 SharePoint 也可用） |
| 任意上下文 + 图片 | Base64 编码内联（无需 SharePoint 也可用） |

### 文件存储位置

上传的文件会存储在已配置 SharePoint 站点默认文档库中的 `/OpenClawShared/` 文件夹下。

## 投票（Adaptive Cards）

OpenClaw 通过 Adaptive Cards 发送 Teams 投票（Teams 没有原生投票 API）。

- CLI：`openclaw message poll --channel msteams --target conversation:<id> ...`
- 投票结果由 Gateway 网关记录在 `~/.openclaw/msteams-polls.json` 中。
- Gateway 网关必须保持在线才能记录投票。
- 投票目前不会自动发布结果摘要（如有需要，请检查该存储文件）。

## Adaptive Cards（任意）

使用 `message` 工具或 CLI，向 Teams 用户或会话发送任意 Adaptive Card JSON。

`card` 参数接受一个 Adaptive Card JSON 对象。提供 `card` 时，消息文本可选。

**智能体工具：**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  card: {
    type: "AdaptiveCard",
    version: "1.5",
    body: [{ type: "TextBlock", text: "Hello!" }],
  },
}
```

**CLI：**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello!"}]}'
```

卡片 schema 和示例请参见 [Adaptive Cards documentation](https://adaptivecards.io/)。有关目标格式的详细信息，请参见下方的[目标格式](#target-formats)。

## 目标格式

MSTeams 目标使用前缀来区分用户和会话：

| 目标类型 | 格式 | 示例 |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| 用户（按 ID） | `user:<aad-object-id>` | `user:40a1a0ed-4ff2-4164-a219-55518990c197` |
| 用户（按名称） | `user:<display-name>` | `user:John Smith`（需要 Graph API） |
| 群组/渠道 | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2` |
| 群组/渠道（原始） | `<conversation-id>` | `19:abc123...@thread.tacv2`（如果包含 `@thread`） |

**CLI 示例：**

```bash
# 按 ID 向用户发送
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# 按显示名称向用户发送（会触发 Graph API 查找）
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# 发送到群聊或渠道
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# 向会话发送 Adaptive Card
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello"}]}'
```

**智能体工具示例：**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Hello!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  card: {
    type: "AdaptiveCard",
    version: "1.5",
    body: [{ type: "TextBlock", text: "Hello" }],
  },
}
```

注意：如果没有 `user:` 前缀，名称默认会按群组/团队解析。按显示名称定位用户时，请始终使用 `user:`。

## 主动消息

- 只有在用户已发生交互后，才可以发送**主动消息**，因为我们会在那时存储会话引用。
- 有关 `dmPolicy` 和 allowlist 门控，请参见 `/gateway/configuration`。

## Team 和 Channel ID（常见陷阱）

Teams URL 中的 `groupId` 查询参数**不是**用于配置的 team ID。请从 URL 路径中提取 ID：

**团队 URL：**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team ID（对其进行 URL 解码）
```

**渠道 URL：**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID（对其进行 URL 解码）
```

**用于配置时：**

- Team ID = `/team/` 后的路径片段（URL 解码后，例如 `19:Bk4j...@thread.tacv2`）
- Channel ID = `/channel/` 后的路径片段（URL 解码后）
- **忽略** `groupId` 查询参数

## 私有渠道

机器人在私有渠道中的支持有限：

| 功能 | 标准渠道 | 私有渠道 |
| ---------------------------- | ----------------- | ---------------------- |
| 机器人安装 | 是 | 有限 |
| 实时消息（webhook） | 是 | 可能不可用 |
| RSC 权限 | 是 | 可能表现不同 |
| @ 提及 | 是 | 如果机器人可访问 |
| Graph API 历史 | 是 | 是（有权限时） |

**如果私有渠道不可用，可尝试以下变通方法：**

1. 使用标准渠道进行机器人交互
2. 使用私信 - 用户始终可以直接向机器人发送消息
3. 使用 Graph API 获取历史访问（需要 `ChannelMessage.Read.All`）

## 故障排除

### 常见问题

- **渠道中不显示图片：** 缺少 Graph 权限或管理员同意。请重新安装 Teams 应用，并完全退出/重新打开 Teams。
- **渠道中没有响应：** 默认需要提及；请设置 `channels.msteams.requireMention=false` 或按团队/渠道进行配置。
- **版本不匹配（Teams 仍显示旧 manifest）：** 删除并重新添加该应用，然后完全退出 Teams 以刷新。
- **Webhook 返回 401 Unauthorized：** 手动测试时未带 Azure JWT，属于预期行为 - 这表示 endpoint 可达，但身份验证失败。请使用 Azure Web Chat 正确测试。

### Manifest 上传错误

- **“Icon file cannot be empty”：** Manifest 引用了 0 字节的图标文件。请创建有效的 PNG 图标（`outline.png` 为 32x32，`color.png` 为 192x192）。
- **“webApplicationInfo.Id already in use”：** 该应用仍安装在其他团队/聊天中。请先找到并卸载，或等待 5 到 10 分钟让变更传播。
- **上传时出现 “Something went wrong”：** 改为通过 [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) 上传，打开浏览器 DevTools（F12）→ Network 选项卡，并检查响应体中的实际错误。
- **侧载失败：** 尝试使用 “Upload an app to your org's app catalog” 而不是 “Upload a custom app” - 这通常能绕过侧载限制。

### RSC 权限不生效

1. 验证 `webApplicationInfo.id` 是否与你机器人的 App ID 完全一致
2. 重新上传应用，并在团队/聊天中重新安装
3. 检查你的组织管理员是否阻止了 RSC 权限
4. 确认你使用的是正确范围：团队使用 `ChannelMessage.Read.Group`，群聊使用 `ChatMessage.Read.Chat`

## 参考资料

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot 设置指南
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - 创建/管理 Teams 应用
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4)（渠道/群组需要 Graph）
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## 相关内容

- [渠道概览](/channels) — 所有受支持的渠道
- [配对](/channels/pairing) — 私信身份验证和配对流程
- [群组](/channels/groups) — 群聊行为和提及门控
- [渠道路由](/channels/channel-routing) — 消息的会话路由
- [安全](/gateway/security) — 访问模型与加固
