---
read_when:
    - 开发 Microsoft Teams 渠道功能
summary: Microsoft Teams 机器人支持状态、能力和配置
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-11T20:21:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7bf8cd0ae6c6053f51794e6bc03bb6d927d640256272f3afb04f3b0ec99eb43
    source_path: channels/msteams.md
    workflow: 16
---

Status: 支持文本 + 私信附件；频道/群组文件发送需要 `sharePointSiteId` + Graph 权限（请参阅[在群组聊天中发送文件](#sending-files-in-group-chats)）。投票通过 Adaptive Cards 发送。消息操作会公开显式的 `upload-file`，用于以文件优先方式发送。

## 内置插件

Microsoft Teams 在当前 OpenClaw 版本中作为内置插件提供，因此在常规打包构建中不需要单独安装。

如果你使用的是较旧构建，或自定义安装排除了内置 Teams，请直接安装 npm 包：

```bash
openclaw plugins install @openclaw/msteams
```

使用裸包名以跟随当前官方发布标签。仅在需要可复现安装时，才固定精确版本。

本地 checkout（从 git 仓库运行时）：

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

详情：[插件](/zh-CN/tools/plugin)

## 快速设置

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) 会通过单个命令处理机器人注册、清单创建和凭证生成。

**1. 安装并登录**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI 目前处于预览阶段。命令和标志可能会随版本变化。
</Note>

**2. 启动隧道**（Teams 无法访问 localhost）

如果你还没有安装和认证 devtunnel CLI，请先完成（[入门指南](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)）。

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
需要 `--allow-anonymous`，因为 Teams 无法使用 devtunnels 进行认证。每个传入的机器人请求仍会由 Teams SDK 自动验证。
</Note>

替代方案：`ngrok http 3978` 或 `tailscale funnel 3978`（但这些可能在每个会话中更改 URL）。

**3. 创建应用**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

这个单一命令会：

- 创建 Entra ID（Azure AD）应用
- 生成客户端密钥
- 构建并上传 Teams 应用清单（含图标）
- 注册机器人（默认由 Teams 托管 - 不需要 Azure 订阅）

输出会显示 `CLIENT_ID`、`CLIENT_SECRET`、`TENANT_ID` 和一个 **Teams App ID** - 请记下这些信息供后续步骤使用。它也会提供直接在 Teams 中安装应用的选项。

**4. 使用输出中的凭证配置 OpenClaw**：

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<CLIENT_ID>",
      appPassword: "<CLIENT_SECRET>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

或者直接使用环境变量：`MSTEAMS_APP_ID`、`MSTEAMS_APP_PASSWORD`、`MSTEAMS_TENANT_ID`。

**5. 在 Teams 中安装应用**

`teams app create` 会提示你安装应用 - 选择 “Install in Teams”。如果你跳过了，可以稍后获取链接：

```bash
teams app get <teamsAppId> --install-link
```

**6. 验证一切正常工作**

```bash
teams app doctor <teamsAppId>
```

这会针对机器人注册、AAD 应用配置、清单有效性和 SSO 设置运行诊断。

对于生产部署，建议使用[联合认证](/zh-CN/channels/msteams#federated-authentication-certificate-plus-managed-identity)（证书或托管身份）代替客户端密钥。

<Note>
群组聊天默认被阻止（`channels.msteams.groupPolicy: "allowlist"`）。要允许群组回复，请设置 `channels.msteams.groupAllowFrom`，或使用 `groupPolicy: "open"` 允许任何成员（仍受提及门控）。
</Note>

## 目标

- 通过 Teams 私信、群组聊天或频道与 OpenClaw 对话。
- 保持路由确定性：回复始终回到其来源频道。
- 默认采用安全的频道行为（除非另有配置，否则需要提及）。

## 配置写入

默认情况下，Microsoft Teams 允许写入由 `/config set|unset` 触发的配置更新（需要 `commands.config: true`）。

使用以下配置禁用：

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## 访问控制（私信 + 群组）

**私信访问**

- 默认：`channels.msteams.dmPolicy = "pairing"`。未知发送者会被忽略，直到获批。
- `channels.msteams.allowFrom` 应使用稳定的 AAD 对象 ID，或静态发送者访问组，例如 `accessGroup:core-team`。
- 不要依赖 UPN/显示名称匹配来做允许列表 - 它们可能会变化。OpenClaw 默认禁用直接名称匹配；需要用 `channels.msteams.dangerouslyAllowNameMatching: true` 显式启用。
- 当凭证允许时，向导可以通过 Microsoft Graph 将名称解析为 ID。

**群组访问**

- 默认：`channels.msteams.groupPolicy = "allowlist"`（除非添加 `groupAllowFrom`，否则阻止）。使用 `channels.defaults.groupPolicy` 覆盖未设置时的默认值。
- `channels.msteams.groupAllowFrom` 控制哪些发送者或静态发送者访问组可以在群组聊天/频道中触发（回退到 `channels.msteams.allowFrom`）。
- 设置 `groupPolicy: "open"` 以允许任何成员（默认仍受提及门控）。
- 要不允许**任何频道**，请设置 `channels.msteams.groupPolicy: "disabled"`。

示例：

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["00000000-0000-0000-0000-000000000000", "accessGroup:core-team"],
    },
  },
}
```

**Teams + 频道允许列表**

- 通过在 `channels.msteams.teams` 下列出团队和频道，限定群组/频道回复范围。
- 键应使用来自 Teams 链接的稳定 Teams 会话 ID，而不是可变的显示名称。
- 当 `groupPolicy="allowlist"` 且存在 teams 允许列表时，仅接受列出的团队/频道（受提及门控）。
- 配置向导接受 `Team/Channel` 条目并为你存储它们。
- 启动时，OpenClaw 会将团队/频道和用户允许列表名称解析为 ID（当 Graph 权限允许时）
  并记录映射；未解析的团队/频道名称会按输入保留，但默认会在路由中忽略，除非启用 `channels.msteams.dangerouslyAllowNameMatching: true`。

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

<details>
<summary><strong>手动设置（不使用 Teams CLI）</strong></summary>

如果你无法使用 Teams CLI，可以通过 Azure Portal 手动设置机器人。

### 工作方式

1. 确保 Microsoft Teams 插件可用（当前版本中已内置）。
2. 创建一个 **Azure Bot**（App ID + 密钥 + 租户 ID）。
3. 构建一个引用该机器人并包含下方 RSC 权限的 **Teams 应用包**。
4. 将 Teams 应用上传/安装到团队中（或安装到个人范围以用于私信）。
5. 在 `~/.openclaw/openclaw.json`（或环境变量）中配置 `msteams` 并启动 Gateway 网关。
6. Gateway 网关默认在 `/api/messages` 上监听 Bot Framework webhook 流量。

### 第 1 步：创建 Azure Bot

1. 前往[创建 Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. 填写 **Basics** 标签页：

   | 字段              | 值                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | 你的机器人名称，例如 `openclaw-msteams`（必须唯一） |
   | **Subscription**   | 选择你的 Azure 订阅                           |
   | **Resource group** | 新建或使用现有资源组                               |
   | **Pricing tier**   | 开发/测试使用 **Free**                                 |
   | **Type of App**    | **Single Tenant**（推荐 - 请参阅下方说明）         |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
新建多租户机器人的能力已在 2025-07-31 之后弃用。新机器人请使用 **Single Tenant**。
</Warning>

3. 点击 **Review + create** → **Create**（等待约 1-2 分钟）

### 第 2 步：获取凭证

1. 前往你的 Azure Bot 资源 → **Configuration**
2. 复制 **Microsoft App ID** → 这就是你的 `appId`
3. 点击 **Manage Password** → 前往 App Registration
4. 在 **Certificates & secrets** 下 → **New client secret** → 复制 **Value** → 这就是你的 `appPassword`
5. 前往 **Overview** → 复制 **Directory (tenant) ID** → 这就是你的 `tenantId`

### 第 3 步：配置消息端点

1. 在 Azure Bot → **Configuration**
2. 将 **Messaging endpoint** 设置为你的 webhook URL：
   - 生产：`https://your-domain.com/api/messages`
   - 本地开发：使用隧道（请参阅下方[本地开发](#local-development-tunneling)）

### 第 4 步：启用 Teams 频道

1. 在 Azure Bot → **Channels**
2. 点击 **Microsoft Teams** → Configure → Save
3. 接受服务条款

### 第 5 步：构建 Teams 应用清单

- 包含一个 `bot` 条目，其中 `botId = <App ID>`。
- 范围：`personal`、`team`、`groupChat`。
- `supportsFiles: true`（个人范围文件处理必需）。
- 添加 RSC 权限（请参阅 [RSC 权限](#current-teams-rsc-permissions-manifest)）。
- 创建图标：`outline.png`（32x32）和 `color.png`（192x192）。
- 将三个文件一起压缩：`manifest.json`、`outline.png`、`color.png`。

### 第 6 步：配置 OpenClaw

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

环境变量：`MSTEAMS_APP_ID`、`MSTEAMS_APP_PASSWORD`、`MSTEAMS_TENANT_ID`。

### 第 7 步：运行 Gateway 网关

当插件可用且存在带凭证的 `msteams` 配置时，Teams 频道会自动启动。

</details>

## 联合认证（证书加托管身份）

> 添加于 2026.4.11

对于生产部署，OpenClaw 支持**联合认证**，作为比客户端密钥更安全的替代方案。可使用两种方法：

### 选项 A：基于证书的认证

使用已在你的 Entra ID 应用注册中登记的 PEM 证书。

**设置：**

1. 生成或获取证书（带私钥的 PEM 格式）。
2. 在 Entra ID → App Registration → **Certificates & secrets** → **Certificates** → 上传公钥证书。

**配置：**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      certificatePath: "/path/to/cert.pem",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**环境变量：**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### 选项 B：Azure 托管身份

使用 Azure Managed Identity 进行无密码认证。这非常适合部署在 Azure 基础设施（AKS、App Service、Azure VM）上且可用托管身份的场景。

**工作方式：**

1. 机器人 pod/VM 拥有托管身份（系统分配或用户分配）。
2. **联合身份凭证**将托管身份链接到 Entra ID 应用注册。
3. 运行时，OpenClaw 使用 `@azure/identity` 从 Azure IMDS 端点（`169.254.169.254`）获取令牌。
4. 令牌会传递给 Teams SDK，用于机器人认证。

**前置条件：**

- 已启用托管身份的 Azure 基础设施（AKS 工作负载身份、App Service、VM）
- 已在 Entra ID 应用注册上创建联合身份凭证
- pod/VM 可访问 IMDS 网络（`169.254.169.254:80`）

**配置（系统分配的托管身份）：**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**配置（用户分配的托管身份）：**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      managedIdentityClientId: "<MI_CLIENT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**环境变量：**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>`（仅适用于用户分配）

### AKS 工作负载身份设置

对于使用工作负载身份的 AKS 部署：

1. 在你的 AKS 集群上**启用工作负载身份**。
2. 在 Entra ID 应用注册上**创建联合身份凭据**：

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. 用应用客户端 ID **标注 Kubernetes 服务账号**：

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. 为工作负载身份注入**标记 Pod**：

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **确保网络可访问** IMDS（`169.254.169.254`）- 如果使用 NetworkPolicy，请添加一条出口规则，允许到端口 80 上 `169.254.169.254/32` 的流量。

### 身份验证类型对比

| 方法                 | 配置                                           | 优点                         | 缺点                              |
| -------------------- | ---------------------------------------------- | ---------------------------- | --------------------------------- |
| **客户端密钥**       | `appPassword`                                  | 设置简单                     | 需要轮换密钥，安全性较低         |
| **证书**             | `authType: "federated"` + `certificatePath`    | 网络中没有共享密钥           | 证书管理开销                     |
| **托管身份**         | `authType: "federated"` + `useManagedIdentity` | 无密码，无需管理密钥         | 需要 Azure 基础设施              |

**默认行为：** 未设置 `authType` 时，OpenClaw 默认使用客户端密钥身份验证。现有配置无需更改即可继续工作。

## 本地开发（隧道）

Teams 无法访问 `localhost`。使用持久开发隧道，让你的 URL 在不同会话中保持不变：

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

替代方案：`ngrok http 3978` 或 `tailscale funnel 3978`（URL 可能每个会话都会变化）。

如果你的隧道 URL 变化，请更新端点：

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## 测试机器人

**运行诊断：**

```bash
teams app doctor <teamsAppId>
```

一次性检查机器人注册、AAD 应用、清单和 SSO 配置。

**发送测试消息：**

1. 安装 Teams 应用（使用 `teams app get <id> --install-link` 中的安装链接）
2. 在 Teams 中找到机器人并发送私信
3. 检查 Gateway 网关日志中是否有传入活动

## 环境变量

所有配置键都可以改用环境变量设置：

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE`（可选：`"secret"` 或 `"federated"`）
- `MSTEAMS_CERTIFICATE_PATH`（联合身份 + 证书）
- `MSTEAMS_CERTIFICATE_THUMBPRINT`（可选，身份验证不需要）
- `MSTEAMS_USE_MANAGED_IDENTITY`（联合身份 + 托管身份）
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID`（仅限用户分配的 MI）

## 成员信息操作

OpenClaw 为 Microsoft Teams 暴露了由 Graph 支持的 `member-info` 操作，让智能体和自动化能够直接从 Microsoft Graph 解析频道成员详情（显示名称、电子邮件、角色）。

要求：

- `Member.Read.Group` RSC 权限（已包含在推荐清单中）
- 对于跨团队查找：需要带管理员同意的 `User.Read.All` Graph 应用程序权限

该操作由 `channels.msteams.actions.memberInfo` 控制（默认值：当 Graph 凭据可用时启用）。

## 历史上下文

- `channels.msteams.historyLimit` 控制有多少最近的频道/群组消息会被包装进提示。
- 回退到 `messages.groupChat.historyLimit`。设置为 `0` 可禁用（默认值 50）。
- 获取到的线程历史会按发送者允许列表（`allowFrom` / `groupAllowFrom`）过滤，因此线程上下文播种只包含来自允许发送者的消息。
- 引用附件上下文（派生自 Teams 回复 HTML 的 `ReplyTo*`）目前会按接收内容传递。
- 换句话说，允许列表控制谁可以触发智能体；目前只有特定补充上下文路径会被过滤。
- 私信历史可通过 `channels.msteams.dmHistoryLimit` 限制（用户轮次）。按用户覆盖：`channels.msteams.dms["<user_id>"].historyLimit`。

## 当前 Teams RSC 权限（清单）

这些是我们 Teams 应用清单中的**现有 resourceSpecific 权限**。它们只在安装应用的团队/聊天内适用。

**对于频道（团队范围）：**

- `ChannelMessage.Read.Group`（Application）- 无需 @提及即可接收所有频道消息
- `ChannelMessage.Send.Group`（Application）
- `Member.Read.Group`（Application）
- `Owner.Read.Group`（Application）
- `ChannelSettings.Read.Group`（Application）
- `TeamMember.Read.Group`（Application）
- `TeamSettings.Read.Group`（Application）

**对于群聊：**

- `ChatMessage.Read.Chat`（Application）- 无需 @提及即可接收所有群聊消息

通过 Teams CLI 添加 RSC 权限：

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Teams 清单示例（已脱敏）

包含所需字段的最小有效示例。替换 ID 和 URL。

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

### 清单注意事项（必备字段）

- `bots[].botId` **必须**匹配 Azure Bot 应用 ID。
- `webApplicationInfo.id` **必须**匹配 Azure Bot 应用 ID。
- `bots[].scopes` 必须包含你计划使用的界面（`personal`、`team`、`groupChat`）。
- 个人范围内的文件处理需要 `bots[].supportsFiles: true`。
- 如果你想要频道流量，`authorization.permissions.resourceSpecific` 必须包含频道读取/发送权限。

### 更新现有应用

更新已安装的 Teams 应用（例如添加 RSC 权限）：

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

更新后，请在每个团队中重新安装应用，使新权限生效，并且**完全退出并重新启动 Teams**（而不只是关闭窗口）以清除缓存的应用元数据。

<details>
<summary>手动更新清单（不使用 CLI）</summary>

1. 用新设置更新你的 `manifest.json`
2. **递增 `version` 字段**（例如 `1.0.0` → `1.1.0`）
3. 用图标（`manifest.json`、`outline.png`、`color.png`）**重新打包为 zip**
4. 上传新的 zip：
   - **Teams 管理中心：** Teams 应用 → 管理应用 → 找到你的应用 → 上传新版本
   - **旁加载：** 在 Teams 中 → 应用 → 管理你的应用 → 上传自定义应用

</details>

## 能力：仅 RSC 与 Graph 对比

### 仅使用 **Teams RSC**（应用已安装，无 Graph API 权限）

可工作：

- 读取频道消息**文本**内容。
- 发送频道消息**文本**内容。
- 接收**个人（私信）**文件附件。

不可工作：

- 频道/群组**图像或文件内容**（载荷只包含 HTML 占位片段）。
- 下载存储在 SharePoint/OneDrive 中的附件。
- 读取消息历史（实时 webhook 事件之外）。

### 使用 **Teams RSC + Microsoft Graph 应用程序权限**

增加：

- 下载托管内容（粘贴到消息中的图像）。
- 下载存储在 SharePoint/OneDrive 中的文件附件。
- 通过 Graph 读取频道/聊天消息历史。

### RSC 与 Graph API

| 能力                    | RSC 权限             | Graph API                         |
| ----------------------- | -------------------- | --------------------------------- |
| **实时消息**            | 是（通过 webhook）   | 否（仅轮询）                      |
| **历史消息**            | 否                   | 是（可查询历史）                  |
| **设置复杂度**          | 仅应用清单           | 需要管理员同意 + 令牌流程         |
| **离线可用**            | 否（必须正在运行）   | 是（随时查询）                    |

**结论：** RSC 用于实时监听；Graph API 用于历史访问。要在离线期间补收错过的消息，你需要使用带 `ChannelMessage.Read.All` 的 Graph API（需要管理员同意）。

## 启用 Graph 的媒体 + 历史（频道必需）

如果你需要**频道**中的图像/文件，或想要获取**消息历史**，必须启用 Microsoft Graph 权限并授予管理员同意。

1. 在 Entra ID（Azure AD）**应用注册**中，添加 Microsoft Graph **应用程序权限**：
   - `ChannelMessage.Read.All`（频道附件 + 历史）
   - `Chat.Read.All` 或 `ChatMessage.Read.All`（群聊）
2. 为租户**授予管理员同意**。
3. 提升 Teams 应用的**清单版本**，重新上传，并在 **Teams 中重新安装应用**。
4. **完全退出并重新启动 Teams**，以清除缓存的应用元数据。

**用户提及的额外权限：** 对于对话中的用户，用户 @提及开箱即用。不过，如果你想动态搜索并提及**不在当前对话中**的用户，请添加 `User.Read.All`（Application）权限并授予管理员同意。

## 已知限制

### Webhook 超时

Teams 通过 HTTP webhook 传递消息。如果处理耗时过长（例如 LLM 响应很慢），你可能会看到：

- Gateway 网关超时
- Teams 重试消息（导致重复）
- 回复丢失

OpenClaw 通过快速返回并主动发送回复来处理这个问题，但非常慢的响应仍可能导致问题。

### 格式

Teams markdown 比 Slack 或 Discord 更受限：

- 基本格式可用：**粗体**、_斜体_、`code`、链接
- 复杂 markdown（表格、嵌套列表）可能无法正确渲染
- Adaptive Cards 支持投票和语义化呈现发送（见下文）

## 配置

关键设置（共享渠道模式见 `/gateway/configuration`）：

- `channels.msteams.enabled`：启用/禁用该渠道。
- `channels.msteams.appId`、`channels.msteams.appPassword`、`channels.msteams.tenantId`：机器人凭证。
- `channels.msteams.webhook.port`（默认 `3978`）
- `channels.msteams.webhook.path`（默认 `/api/messages`）
- `channels.msteams.dmPolicy`：`pairing | allowlist | open | disabled`（默认：配对）
- `channels.msteams.allowFrom`：私信允许列表（推荐使用 AAD 对象 ID）。当 Graph 访问可用时，向导会在设置期间将名称解析为 ID。
- `channels.msteams.dangerouslyAllowNameMatching`：应急开关，用于重新启用可变的 UPN/显示名称匹配，以及直接的团队/频道名称路由。
- `channels.msteams.textChunkLimit`：出站文本分块大小。
- `channels.msteams.chunkMode`：`length`（默认）或 `newline`，用于在按长度分块前先按空行（段落边界）拆分。
- `channels.msteams.mediaAllowHosts`：入站附件主机允许列表（默认 Microsoft/Teams 域）。
- `channels.msteams.mediaAuthAllowHosts`：媒体重试时可附加 Authorization 标头的允许列表（默认 Graph + Bot Framework 主机）。
- `channels.msteams.requireMention`：在频道/群组中要求 @提及（默认 true）。
- `channels.msteams.replyStyle`：`thread | top-level`（见 [回复样式](#reply-style-threads-vs-posts)）。
- `channels.msteams.teams.<teamId>.replyStyle`：按团队覆盖。
- `channels.msteams.teams.<teamId>.requireMention`：按团队覆盖。
- `channels.msteams.teams.<teamId>.tools`：默认的按团队工具策略覆盖（`allow`/`deny`/`alsoAllow`），在缺少频道覆盖时使用。
- `channels.msteams.teams.<teamId>.toolsBySender`：默认的按团队、按发送者工具策略覆盖（支持 `"*"` 通配符）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`：按频道覆盖。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`：按频道覆盖。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`：按频道工具策略覆盖（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`：按频道、按发送者工具策略覆盖（支持 `"*"` 通配符）。
- `toolsBySender` 键应使用显式前缀：
  `channel:`、`id:`、`e164:`、`username:`、`name:`（旧版未加前缀的键仍只映射到 `id:`）。
- `channels.msteams.actions.memberInfo`：启用或禁用由 Graph 支持的成员信息操作（默认：当 Graph 凭证可用时启用）。
- `channels.msteams.authType`：身份验证类型 - `"secret"`（默认）或 `"federated"`。
- `channels.msteams.certificatePath`：PEM 证书文件路径（联合 + 证书身份验证）。
- `channels.msteams.certificateThumbprint`：证书指纹（可选，身份验证不要求）。
- `channels.msteams.useManagedIdentity`：启用托管标识身份验证（联合模式）。
- `channels.msteams.managedIdentityClientId`：用户分配的托管标识的客户端 ID。
- `channels.msteams.sharePointSiteId`：用于在群聊/频道中上传文件的 SharePoint 站点 ID（见 [在群聊中发送文件](#sending-files-in-group-chats)）。

## 路由和会话

- 会话键遵循标准智能体格式（见 [/concepts/session](/zh-CN/concepts/session)）：
  - 直接消息共享主会话（`agent:<agentId>:<mainKey>`）。
  - 频道/群组消息使用会话 ID：
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 回复样式：线程与帖子

Teams 最近在同一底层数据模型上引入了两种频道 UI 样式：

| 样式                     | 描述                                               | 推荐的 `replyStyle` |
| ------------------------ | -------------------------------------------------- | ------------------- |
| **帖子**（经典）         | 消息显示为卡片，下面带有线程回复                   | `thread`（默认）    |
| **线程**（类似 Slack）   | 消息线性流动，更像 Slack                           | `top-level`         |

**问题：** Teams API 不会公开频道使用哪种 UI 样式。如果使用了错误的 `replyStyle`：

- 在线程样式频道中使用 `thread` → 回复会以别扭的嵌套形式显示
- 在帖子样式频道中使用 `top-level` → 回复会显示为单独的顶层帖子，而不是在线程内

**解决方案：** 根据频道的设置方式为每个频道配置 `replyStyle`：

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

### 解析优先级

当机器人向频道发送回复时，`replyStyle` 会从最具体的覆盖项向下解析到默认值。第一个非 `undefined` 值生效：

1. **按频道** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **按团队** — `channels.msteams.teams.<teamId>.replyStyle`
3. **全局** — `channels.msteams.replyStyle`
4. **隐式默认值** — 从 `requireMention` 派生：
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

如果你在全局设置 `requireMention: false`，但没有显式设置 `replyStyle`，那么帖子样式频道中的提及会显示为顶层帖子，即使入站消息是线程回复。请在全局、团队或频道级别固定 `replyStyle: "thread"` 以避免意外。

### 线程上下文保留

当 `replyStyle: "thread"` 生效，并且机器人是在频道线程内被 @提及时，OpenClaw 会将原始线程根重新附加到出站会话引用（`19:…@thread.tacv2;messageid=<root>`），使回复落在同一线程内。这同时适用于实时（轮次内）发送，以及 Bot Framework 轮次上下文过期后进行的主动发送（例如长时间运行的智能体、通过 `mcp__openclaw__message` 排队的工具调用回复）。

线程根取自会话引用中存储的 `threadId`。早于 `threadId` 的旧存储引用会回退到 `activityId`（也就是最后一次为会话播种的任何入站活动），因此现有部署无需重新播种即可继续工作。

当 `replyStyle: "top-level"` 生效时，频道线程入站会被有意作为新的顶层帖子回答，不会附加线程后缀。这是线程样式频道的正确行为；如果你看到顶层帖子，但预期是线程回复，那么该频道的 `replyStyle` 设置不正确。

## 附件和图片

**当前限制：**

- **私信：** 图片和文件附件通过 Teams 机器人文件 API 工作。
- **频道/群组：** 附件位于 M365 存储（SharePoint/OneDrive）中。Webhook 载荷只包含 HTML 存根，而不包含实际文件字节。**需要 Graph API 权限**才能下载频道附件。
- 对于显式以文件为主的发送，请使用 `action=upload-file` 搭配 `media` / `filePath` / `path`；可选的 `message` 会成为随附文本/评论，`filename` 会覆盖上传名称。

如果没有 Graph 权限，带图片的频道消息将以纯文本形式接收（机器人无法访问图片内容）。
默认情况下，OpenClaw 只会从 Microsoft/Teams 主机名下载媒体。可通过 `channels.msteams.mediaAllowHosts` 覆盖（使用 `["*"]` 允许任何主机）。
Authorization 标头只会附加到 `channels.msteams.mediaAuthAllowHosts` 中的主机（默认 Graph + Bot Framework 主机）。请保持此列表严格（避免多租户后缀）。

## 在群聊中发送文件

机器人可以使用 FileConsentCard 流程（内置）在私信中发送文件。不过，**在群聊/频道中发送文件**需要额外设置：

| 上下文                   | 文件发送方式                                 | 所需设置                                        |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **私信**                 | FileConsentCard → 用户接受 → 机器人上传      | 开箱即用                                        |
| **群聊/频道**            | 上传到 SharePoint → 共享链接                 | 需要 `sharePointSiteId` + Graph 权限            |
| **图片（任何上下文）**   | Base64 编码内联                              | 开箱即用                                        |

### 为什么群聊需要 SharePoint

机器人没有个人 OneDrive 驱动器（`/me/drive` Graph API 端点不适用于应用程序标识）。要在群聊/频道中发送文件，机器人会上传到一个 **SharePoint 站点**并创建共享链接。

### 设置

1. **添加 Graph API 权限**，位置在 Entra ID（Azure AD）→ 应用注册：
   - `Sites.ReadWrite.All`（应用程序）- 将文件上传到 SharePoint
   - `Chat.Read.All`（应用程序）- 可选，启用按用户共享链接

2. **为租户授予管理员同意**。

3. **获取你的 SharePoint 站点 ID：**

   ```bash
   # Via Graph Explorer or curl with a valid token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Example: for a site at "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Response includes: "id": "contoso.sharepoint.com,guid1,guid2"
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

| 权限                                    | 共享行为                                             |
| --------------------------------------- | ---------------------------------------------------- |
| 仅 `Sites.ReadWrite.All`                | 组织范围共享链接（组织中的任何人都可访问）           |
| `Sites.ReadWrite.All` + `Chat.Read.All` | 按用户共享链接（只有聊天成员可访问）                 |

按用户共享更安全，因为只有聊天参与者可以访问文件。如果缺少 `Chat.Read.All` 权限，机器人会回退到组织范围共享。

### 回退行为

| 场景                                             | 结果                                                |
| ------------------------------------------------ | --------------------------------------------------- |
| 群聊 + 文件 + 已配置 `sharePointSiteId`          | 上传到 SharePoint，发送共享链接                     |
| 群聊 + 文件 + 未配置 `sharePointSiteId`          | 尝试 OneDrive 上传（可能失败），仅发送文本          |
| 个人聊天 + 文件                                  | FileConsentCard 流程（无需 SharePoint 即可工作）    |
| 任何上下文 + 图片                                | Base64 编码内联（无需 SharePoint 即可工作）         |

### 文件存储位置

上传的文件会存储在已配置 SharePoint 站点默认文档库中的 `/OpenClawShared/` 文件夹内。

## 投票（Adaptive Cards）

OpenClaw 以 Adaptive Cards 形式发送 Teams 投票（没有原生 Teams 投票 API）。

- CLI：`openclaw message poll --channel msteams --target conversation:<id> ...`
- 投票由 Gateway 网关记录在 `~/.openclaw/msteams-polls.json` 中。
- Gateway 网关必须保持在线才能记录投票。
- 投票目前还不会自动发布结果摘要（如果需要，请检查存储文件）。

## 呈现卡片

使用 `message` 工具或 CLI 向 Teams 用户或对话发送语义化呈现载荷。OpenClaw 会根据通用呈现契约将其渲染为 Teams Adaptive Cards。

`presentation` 参数接受语义块。提供 `presentation` 时，消息文本是可选的。

**Agent 工具：**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello!" }],
  },
}
```

**CLI：**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello!"}]}'
```

有关目标格式的详细信息，请参见下方的[目标格式](#target-formats)。

## 目标格式

MSTeams 目标使用前缀来区分用户和对话：

| 目标类型         | 格式                           | 示例                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| 用户（按 ID）        | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| 用户（按名称）      | `user:<display-name>`            | `user:John Smith`（需要 Graph API）              |
| 群组/频道       | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| 群组/频道（原始） | `<conversation-id>`              | `19:abc123...@thread.tacv2`（如果包含 `@thread`） |

**CLI 示例：**

```bash
# Send to a user by ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Send to a user by display name (triggers Graph API lookup)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Send to a group chat or channel
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Send a presentation card to a conversation
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**Agent 工具示例：**

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
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello" }],
  },
}
```

<Note>
如果没有 `user:` 前缀，名称默认按群组或团队解析。按显示名称定位人员时，请始终使用 `user:`。
</Note>

## 主动消息发送

- 主动消息仅在用户交互**之后**才可用，因为我们会在那时存储对话引用。
- 关于 `dmPolicy` 和允许列表门控，请参见 `/gateway/configuration`。

## 团队和频道 ID（常见陷阱）

Teams URL 中的 `groupId` 查询参数**不是**用于配置的团队 ID。请改为从 URL 路径中提取 ID：

**团队 URL：**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**频道 URL：**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**用于配置：**

- 团队键 = `/team/` 之后的路径段（URL 解码后，例如 `19:Bk4j...@thread.tacv2`；较旧租户可能显示 `@thread.skype`，这同样有效）
- 频道键 = `/channel/` 之后的路径段（URL 解码后）
- **忽略** OpenClaw 路由中的 `groupId` 查询参数。它是 Microsoft Entra 群组 ID，而不是传入 Teams 活动中使用的 Bot Framework 对话 ID。

## 私有频道

机器人对私有频道的支持有限：

| 功能                      | 标准频道 | 私有频道       |
| ---------------------------- | ----------------- | ---------------------- |
| 机器人安装             | 是               | 有限                |
| 实时消息（webhook） | 是               | 可能无法工作           |
| RSC 权限              | 是               | 行为可能不同 |
| @ 提及                    | 是               | 如果机器人可访问   |
| Graph API 历史记录            | 是               | 是（需要权限） |

**如果私有频道无法工作，可采用的解决方法：**

1. 使用标准频道进行机器人交互
2. 使用私信 - 用户始终可以直接向机器人发送消息
3. 使用 Graph API 进行历史访问（需要 `ChannelMessage.Read.All`）

## 故障排除

### 常见问题

- **频道中不显示图片：** 缺少 Graph 权限或管理员同意。重新安装 Teams 应用，并完全退出/重新打开 Teams。
- **频道中没有响应：** 默认需要提及；设置 `channels.msteams.requireMention=false`，或按团队/频道配置。
- **版本不匹配（Teams 仍显示旧清单）：** 移除并重新添加应用，然后完全退出 Teams 以刷新。
- **webhook 返回 401 Unauthorized：** 手动测试时没有 Azure JWT 属于预期情况，表示端点可访问但认证失败。请使用 Azure Web Chat 正确测试。

### 清单上传错误

- **“Icon file cannot be empty”：** 清单引用的图标文件为 0 字节。创建有效的 PNG 图标（`outline.png` 为 32x32，`color.png` 为 192x192）。
- **“webApplicationInfo.Id already in use”：** 应用仍安装在另一个团队/聊天中。先找到并卸载它，或等待 5-10 分钟以完成传播。
- **上传时出现 “Something went wrong”：** 改用 [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) 上传，打开浏览器 DevTools（F12）→ Network 选项卡，并检查响应正文中的实际错误。
- **侧载失败：** 尝试使用 “Upload an app to your org's app catalog”，而不是 “Upload a custom app” - 这通常可以绕过侧载限制。

### RSC 权限无法工作

1. 验证 `webApplicationInfo.id` 与你的机器人 App ID 完全匹配
2. 重新上传应用，并在团队/聊天中重新安装
3. 检查你的组织管理员是否已阻止 RSC 权限
4. 确认你使用了正确的作用域：团队使用 `ChannelMessage.Read.Group`，群聊使用 `ChatMessage.Read.Chat`

## 参考

- [创建 Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot 设置指南
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - 创建/管理 Teams 应用
- [Teams 应用清单架构](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [使用 RSC 接收频道消息](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC 权限参考](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams 机器人文件处理](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4)（频道/群组需要 Graph）
- [主动消息发送](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - 用于机器人管理的 Teams CLI

## 相关

- [频道概览](/zh-CN/channels) - 所有支持的渠道
- [配对](/zh-CN/channels/pairing) - 私信认证和配对流程
- [群组](/zh-CN/channels/groups) - 群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) - 消息的会话路由
- [安全](/zh-CN/gateway/security) - 访问模型和加固
