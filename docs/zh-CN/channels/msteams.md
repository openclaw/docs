---
read_when:
    - 开发 Microsoft Teams 渠道功能
summary: Microsoft Teams 机器人支持状态、能力和配置
title: Microsoft Teams
x-i18n:
    generated_at: "2026-06-27T01:24:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cad5dc92b3a70e85412cbf34c926d7211dce7534c31387744e6f085bcfe23f08
    source_path: channels/msteams.md
    workflow: 16
---

状态：支持文本 + 私信附件；频道/群组文件发送需要 `sharePointSiteId` + Graph 权限（参见[在群组聊天中发送文件](#sending-files-in-group-chats)）。投票通过 Adaptive Cards 发送。消息操作会公开显式的 `upload-file`，用于文件优先发送。

## 内置插件

Microsoft Teams 在当前 OpenClaw 版本中作为内置插件提供，因此在正常的打包构建中不需要单独安装。

如果你使用的是较旧构建，或自定义安装中排除了内置 Teams，请直接安装 npm 包：

```bash
openclaw plugins install @openclaw/msteams
```

使用裸包以跟随当前官方发布标签。仅在需要可复现安装时固定精确版本。

本地检出（从 git 仓库运行时）：

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

详情：[插件](/zh-CN/tools/plugin)

## 快速设置

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) 可通过单个命令处理 Bot 注册、清单创建和凭据生成。

**1. 安装并登录**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI 目前处于预览阶段。命令和标志可能会在不同版本之间变化。
</Note>

**2. 启动隧道**（Teams 无法访问 localhost）

如果你尚未安装并认证 devtunnel CLI，请先完成安装和认证（[入门指南](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)）。

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
必须使用 `--allow-anonymous`，因为 Teams 无法通过 devtunnels 进行认证。每个传入的 Bot 请求仍会由 Teams SDK 自动验证。
</Note>

替代方案：`ngrok http 3978` 或 `tailscale funnel 3978`（但这些方案可能每次会话都会更改 URL）。

**3. 创建应用**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

这个单个命令会：

- 创建一个 Entra ID（Azure AD）应用程序
- 生成客户端密钥
- 构建并上传 Teams 应用清单（包含图标）
- 注册 Bot（默认由 Teams 管理 - 不需要 Azure 订阅）

输出会显示 `CLIENT_ID`、`CLIENT_SECRET`、`TENANT_ID` 和一个 **Teams App ID** - 请记录下来以供后续步骤使用。它还会提供直接在 Teams 中安装应用的选项。

**4. 配置 OpenClaw**，使用输出中的凭据：

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

也可以直接使用环境变量：`MSTEAMS_APP_ID`、`MSTEAMS_APP_PASSWORD`、`MSTEAMS_TENANT_ID`。

**5. 在 Teams 中安装应用**

`teams app create` 会提示你安装应用 - 选择 “Install in Teams”。如果你跳过了这一步，稍后可以获取链接：

```bash
teams app get <teamsAppId> --install-link
```

**6. 验证一切正常**

```bash
teams app doctor <teamsAppId>
```

这会跨 Bot 注册、AAD 应用配置、清单有效性和 SSO 设置运行诊断。

对于生产部署，请考虑使用[联合认证](/zh-CN/channels/msteams#federated-authentication-certificate-plus-managed-identity)（证书或托管标识），而不是客户端密钥。

<Note>
默认阻止群组聊天（`channels.msteams.groupPolicy: "allowlist"`）。要允许群组回复，请设置 `channels.msteams.groupAllowFrom`，或使用 `groupPolicy: "open"` 允许任何成员（仍需提及触发）。
</Note>

## 目标

- 通过 Teams 私信、群组聊天或频道与 OpenClaw 对话。
- 保持路由确定性：回复始终返回到它们进入的频道。
- 默认使用安全的频道行为（除非另有配置，否则需要提及）。

## 配置写入

默认情况下，Microsoft Teams 允许写入由 `/config set|unset` 触发的配置更新（需要 `commands.config: true`）。

通过以下方式禁用：

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## 访问控制（私信 + 群组）

**私信访问**

- 默认：`channels.msteams.dmPolicy = "pairing"`。未知发送者在获批前会被忽略。
- `channels.msteams.allowFrom` 应使用稳定的 AAD 对象 ID，或使用静态发送者访问组，例如 `accessGroup:core-team`。
- 不要依赖 UPN/显示名称匹配来做允许列表 - 它们可能会变化。OpenClaw 默认禁用直接名称匹配；如需使用，请通过 `channels.msteams.dangerouslyAllowNameMatching: true` 显式启用。
- 当凭据允许时，向导可以通过 Microsoft Graph 将名称解析为 ID。

**群组访问**

- 默认：`channels.msteams.groupPolicy = "allowlist"`（除非添加 `groupAllowFrom`，否则阻止）。未设置时，可使用 `channels.defaults.groupPolicy` 覆盖默认值。
- `channels.msteams.groupAllowFrom` 控制哪些发送者或静态发送者访问组可以在群组聊天/频道中触发（回退到 `channels.msteams.allowFrom`）。
- 设置 `groupPolicy: "open"` 允许任何成员（默认仍需提及触发）。
- 要允许**无频道**，请设置 `channels.msteams.groupPolicy: "disabled"`。

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

- 通过在 `channels.msteams.teams` 下列出团队和频道来限定群组/频道回复范围。
- 键应使用 Teams 链接中的稳定 Teams 会话 ID，而不是可变的显示名称。
- 当 `groupPolicy="allowlist"` 且存在团队允许列表时，仅接受列出的团队/频道（需提及触发）。
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

如果你无法使用 Teams CLI，可以通过 Azure Portal 手动设置 Bot。

### 工作原理

1. 确保 Microsoft Teams 插件可用（当前版本中已内置）。
2. 创建一个 **Azure Bot**（App ID + 密钥 + 租户 ID）。
3. 构建一个引用该 Bot 并包含以下 RSC 权限的 **Teams 应用包**。
4. 将 Teams 应用上传/安装到团队中（或安装到个人范围以用于私信）。
5. 在 `~/.openclaw/openclaw.json`（或环境变量）中配置 `msteams` 并启动 Gateway 网关。
6. Gateway 网关默认在 `/api/messages` 上监听 Bot Framework webhook 流量。

### 步骤 1：创建 Azure Bot

1. 前往[创建 Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. 填写 **Basics** 选项卡：

   | 字段               | 值                                                       |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | 你的 Bot 名称，例如 `openclaw-msteams`（必须唯一）       |
   | **Subscription**   | 选择你的 Azure 订阅                                     |
   | **Resource group** | 新建或使用现有资源组                                   |
   | **Pricing tier**   | 用于开发/测试的 **Free**                                |
   | **Type of App**    | **Single Tenant**（推荐 - 见下方说明）                  |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
新的多租户 Bot 创建已在 2025-07-31 后弃用。新 Bot 请使用 **Single Tenant**。
</Warning>

3. 点击 **Review + create** → **Create**（等待约 1-2 分钟）

### 步骤 2：获取凭据

1. 转到你的 Azure Bot 资源 → **Configuration**
2. 复制 **Microsoft App ID** → 这是你的 `appId`
3. 点击 **Manage Password** → 转到 App Registration
4. 在 **Certificates & secrets** 下 → **New client secret** → 复制 **Value** → 这是你的 `appPassword`
5. 转到 **Overview** → 复制 **Directory (tenant) ID** → 这是你的 `tenantId`

### 步骤 3：配置消息端点

1. 在 Azure Bot → **Configuration**
2. 将 **Messaging endpoint** 设置为你的 webhook URL：
   - 生产：`https://your-domain.com/api/messages`
   - 本地开发：使用隧道（见下方[本地开发](#local-development-tunneling)）

### 步骤 4：启用 Teams 频道

1. 在 Azure Bot → **Channels**
2. 点击 **Microsoft Teams** → Configure → Save
3. 接受服务条款

### 步骤 5：构建 Teams 应用清单

- 包含一个 `bot` 条目，其中 `botId = <App ID>`。
- 范围：`personal`、`team`、`groupChat`。
- `supportsFiles: true`（个人范围文件处理所必需）。
- 添加 RSC 权限（参见 [RSC 权限](#current-teams-rsc-permissions-manifest)）。
- 创建图标：`outline.png`（32x32）和 `color.png`（192x192）。
- 将三个文件一起压缩：`manifest.json`、`outline.png`、`color.png`。

### 步骤 6：配置 OpenClaw

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

### 步骤 7：运行 Gateway 网关

当插件可用且 `msteams` 配置存在凭据时，Teams 渠道会自动启动。

</details>

## 联合认证（证书加托管标识）

> 添加于 2026.4.11

对于生产部署，OpenClaw 支持**联合认证**，作为比客户端密钥更安全的替代方案。有两种方法可用：

### 选项 A：基于证书的认证

使用在你的 Entra ID 应用注册中注册的 PEM 证书。

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

### 选项 B：Azure 托管标识

使用 Azure 托管标识进行无密码认证。这非常适合部署在具备托管标识的 Azure 基础设施上（AKS、App Service、Azure VM）。

**工作原理：**

1. Bot pod/VM 具有托管标识（系统分配或用户分配）。
2. 一个**联合标识凭据**将该托管标识关联到 Entra ID 应用注册。
3. 运行时，OpenClaw 使用 `@azure/identity` 从 Azure IMDS 端点（`169.254.169.254`）获取令牌。
4. 令牌会传递给 Teams SDK，用于 Bot 认证。

**前提条件：**

- 启用了托管标识的 Azure 基础设施（AKS 工作负载标识、App Service、VM）
- 已在 Entra ID 应用注册上创建联合标识凭据
- pod/VM 可访问 IMDS（`169.254.169.254:80`）网络

**配置（系统分配的托管标识）：**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>`（仅用于用户分配）

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

3. 用应用客户端 ID **注解 Kubernetes 服务账号**：

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

5. **确保网络可访问** IMDS（`169.254.169.254`）- 如果使用 NetworkPolicy，请添加一条出站规则，允许流量通过 80 端口访问 `169.254.169.254/32`。

### 身份验证类型对比

| 方法                 | 配置                                           | 优点                               | 缺点                               |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ---------------------------------- |
| **客户端密钥**       | `appPassword`                                  | 设置简单                           | 需要轮换密钥，安全性较低           |
| **证书**             | `authType: "federated"` + `certificatePath`    | 网络中不传输共享密钥               | 证书管理开销                       |
| **托管身份**         | `authType: "federated"` + `useManagedIdentity` | 无密码，无需管理密钥               | 需要 Azure 基础设施                |

**默认行为：** 未设置 `authType` 时，OpenClaw 默认使用客户端密钥身份验证。现有配置无需更改即可继续工作。

## 本地开发（隧道）

Teams 无法访问 `localhost`。使用持久开发隧道，让你的 URL 在不同会话之间保持不变：

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

替代方案：`ngrok http 3978` 或 `tailscale funnel 3978`（URL 可能在每个会话中变化）。

如果你的隧道 URL 发生变化，请更新端点：

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

所有配置键名也可以通过环境变量设置：

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE`（可选：`"secret"` 或 `"federated"`）
- `MSTEAMS_CERTIFICATE_PATH`（联合 + 证书）
- `MSTEAMS_CERTIFICATE_THUMBPRINT`（可选，身份验证不需要）
- `MSTEAMS_USE_MANAGED_IDENTITY`（联合 + 托管身份）
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID`（仅用户分配的 MI）

## 成员信息操作

OpenClaw 为 Microsoft Teams 暴露了一个由 Graph 支持的 `member-info` 操作，让智能体和自动化可以直接从 Microsoft Graph 解析渠道成员详情（显示名称、电子邮件、角色）。

要求：

- `Member.Read.Group` RSC 权限（已包含在推荐清单中）
- 对于跨团队查找：需要带管理员同意的 `User.Read.All` Graph Application 权限

该操作受 `channels.msteams.actions.memberInfo` 控制（默认：Graph 凭据可用时启用）。

## 历史上下文

- `channels.msteams.historyLimit` 控制有多少最近的渠道/群组消息会被包装进提示词。
- 回退到 `messages.groupChat.historyLimit`。设为 `0` 可禁用（默认 50）。
- 拉取的线程历史会按发送者允许列表（`allowFrom` / `groupAllowFrom`）过滤，因此线程上下文播种只包含来自允许发送者的消息。
- 引用附件上下文（从 Teams 回复 HTML 派生的 `ReplyTo*`）目前会按接收内容传递。
- 换句话说，允许列表控制谁可以触发智能体；目前只有特定的补充上下文路径会被过滤。
- 私信历史可通过 `channels.msteams.dmHistoryLimit`（用户轮次）限制。按用户覆盖：`channels.msteams.dms["<user_id>"].historyLimit`。

## 当前 Teams RSC 权限（清单）

这些是我们的 Teams 应用清单中**现有的 resourceSpecific 权限**。它们仅适用于安装该应用的团队/聊天内部。

**对于渠道（团队范围）：**

- `ChannelMessage.Read.Group`（Application）- 无需 @mention 即可接收所有渠道消息
- `ChannelMessage.Send.Group`（Application）
- `Member.Read.Group`（Application）
- `Owner.Read.Group`（Application）
- `ChannelSettings.Read.Group`（Application）
- `TeamMember.Read.Group`（Application）
- `TeamSettings.Read.Group`（Application）

**对于群聊：**

- `ChatMessage.Read.Chat`（Application）- 无需 @mention 即可接收所有群聊消息

要通过 Teams CLI 添加 RSC 权限：

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Teams 清单示例（已遮盖）

包含必填字段的最小有效示例。替换 ID 和 URL。

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

### 清单注意事项（必填字段）

- `bots[].botId` **必须**匹配 Azure Bot App ID。
- `webApplicationInfo.id` **必须**匹配 Azure Bot App ID。
- `bots[].scopes` 必须包含你计划使用的界面（`personal`、`team`、`groupChat`）。
- `bots[].supportsFiles: true` 是个人范围中文件处理所必需的。
- 如果你需要渠道流量，`authorization.permissions.resourceSpecific` 必须包含渠道读取/发送权限。

### 更新现有应用

要更新已安装的 Teams 应用（例如添加 RSC 权限）：

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

更新后，请在每个团队中重新安装该应用，以使新权限生效，并且**完全退出并重新启动 Teams**（不只是关闭窗口）以清除缓存的应用元数据。

<details>
<summary>手动更新清单（不使用 CLI）</summary>

1. 使用新设置更新你的 `manifest.json`
2. **递增 `version` 字段**（例如，`1.0.0` → `1.1.0`）
3. **重新压缩**带图标的清单（`manifest.json`、`outline.png`、`color.png`）
4. 上传新的 zip：
   - **Teams 管理中心：** Teams 应用 → 管理应用 → 找到你的应用 → 上传新版本
   - **侧载：** 在 Teams 中 → 应用 → 管理你的应用 → 上传自定义应用

</details>

## 能力：仅 RSC 与 Graph

### 仅使用 **Teams RSC**（已安装应用，无 Graph API 权限）

可用：

- 读取渠道消息**文本**内容。
- 发送渠道消息**文本**内容。
- 接收**个人（私信）**文件附件。

不可用：

- 渠道/群组**图片或文件内容**（载荷仅包含 HTML 占位片段）。
- 下载存储在 SharePoint/OneDrive 中的附件。
- 读取消息历史（实时 webhook 事件之外）。

### 使用 **Teams RSC + Microsoft Graph Application 权限**

新增：

- 下载托管内容（粘贴到消息中的图片）。
- 下载存储在 SharePoint/OneDrive 中的文件附件。
- 通过 Graph 读取渠道/聊天消息历史。

### RSC 与 Graph API

| 能力                   | RSC 权限             | Graph API                           |
| ---------------------- | -------------------- | ----------------------------------- |
| **实时消息**           | 是（通过 webhook）   | 否（仅轮询）                        |
| **历史消息**           | 否                   | 是（可查询历史）                    |
| **设置复杂度**         | 仅应用清单           | 需要管理员同意 + 令牌流程           |
| **离线可用**           | 否（必须运行中）     | 是（随时查询）                      |

**结论：** RSC 用于实时监听；Graph API 用于历史访问。要在离线期间补读错过的消息，你需要带 `ChannelMessage.Read.All` 的 Graph API（需要管理员同意）。

## 启用 Graph 的媒体 + 历史（渠道必需）

如果你需要**渠道**中的图片/文件，或想拉取**消息历史**，必须启用 Microsoft Graph 权限并授予管理员同意。

1. 在 Entra ID（Azure AD）**应用注册**中，添加 Microsoft Graph **Application 权限**：
   - `ChannelMessage.Read.All`（渠道附件 + 历史）
   - `Chat.Read.All` 或 `ChatMessage.Read.All`（群聊）
2. **授予管理员同意**给租户。
3. 提升 Teams 应用**清单版本**，重新上传，并**在 Teams 中重新安装应用**。
4. **完全退出并重新启动 Teams**以清除缓存的应用元数据。

**用户提及的额外权限：** 对话中的用户 @mentions 可开箱即用。但是，如果你想动态搜索并提及**不在当前对话中**的用户，请添加 `User.Read.All`（Application）权限并授予管理员同意。

## 已知限制

### Webhook 超时

Teams 通过 HTTP webhook 投递消息。如果处理时间过长（例如 LLM 响应较慢），你可能会看到：

- Gateway 网关超时
- Teams 重试消息（导致重复）
- 回复丢失

OpenClaw 通过快速返回并主动发送回复来处理这种情况，但非常慢的响应仍可能导致问题。

### Teams 云和服务 URL 支持

这条基于 SDK 的 Teams 路径已针对 Microsoft Teams 公有云完成实时验证。

入站回复使用传入的 Teams SDK 轮次上下文。上下文之外的主动操作（发送、编辑、删除、卡片、投票、文件同意消息，以及排队的长时间运行回复）使用已存储会话引用中的 `serviceUrl`。公有云默认使用 Teams SDK 公有云环境，并允许公有 Teams Connector 主机上的已存储引用：`https://smba.trafficmanager.net/`。

公有云是默认值。对于普通公有云 bot，你不需要设置 `channels.msteams.cloud` 或 `channels.msteams.serviceUrl`。

对于非公有 Teams 云，在 Microsoft 发布对应边界后设置 `cloud` 和匹配的主动操作边界：

- `channels.msteams.cloud` 选择用于身份验证、JWT 验证、令牌服务和 Graph 范围的 Teams SDK 云预设。
- `channels.msteams.serviceUrl` 选择 Bot Connector 端点边界，用于在主动发送、编辑、删除、卡片、投票、文件同意消息和排队的长时间运行回复之前验证已存储的会话引用。USGov 和 DoD SDK 云需要它。对于 China/21Vianet，OpenClaw 使用 SDK `China` 预设，并且只接受 Azure China Bot Framework 频道主机上的已存储/已配置服务 URL。

Microsoft 在 Teams 主动消息文档的 [创建会话](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation)部分发布了全局主动 Bot Connector 端点。可用时使用传入活动的 `serviceUrl`；如果你需要全局主动端点，请使用 Microsoft 的表格。

| Teams 环境 | OpenClaw 配置                                             | 主动 `serviceUrl`                             |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| Public            | 不需要 cloud/serviceUrl 配置                           | `https://smba.trafficmanager.net/teams`            |
| GCC               | 设置 `serviceUrl`；不存在单独的 Teams SDK 云预设 | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High          | `cloud: "USGov"` + `serviceUrl`                             | `https://smba.infra.gov.teams.microsoft.us/teams`  |
| DoD               | `cloud: "USGovDoD"` + `serviceUrl`                          | `https://smba.infra.dod.teams.microsoft.us/teams`  |
| China/21Vianet    | `cloud: "China"`                                            | 使用传入活动的 `serviceUrl`           |

GCC 示例：Microsoft 记录了单独的主动服务 URL，但 Teams SDK 不公开单独的 GCC 云预设：

```json
{
  "channels": {
    "msteams": {
      "serviceUrl": "https://smba.infra.gcc.teams.microsoft.com/teams"
    }
  }
}
```

GCC High 示例：

```json
{
  "channels": {
    "msteams": {
      "cloud": "USGov",
      "serviceUrl": "https://smba.infra.gov.teams.microsoft.us/teams"
    }
  }
}
```

`channels.msteams.serviceUrl` 仅限受支持的 Microsoft Teams Bot Connector 主机。配置服务 URL 后，OpenClaw 会在主动发送、编辑、删除、卡片、投票或排队的长时间运行回复运行之前，检查已存储会话的 `serviceUrl` 是否使用相同主机。使用默认公有云配置时，如果已存储会话指向公有 Teams Connector 主机之外，OpenClaw 会失败并关闭操作。更改云/服务 URL 设置后，从该会话接收一条新消息，确保已存储会话引用是最新的。

China/21Vianet 在 Microsoft 的 Teams 主动端点表中没有单独的全局主动 `smba` URL。配置 `cloud: "China"`，让 Teams SDK 使用 Azure China 的身份验证、令牌和 JWT 端点。之后，主动发送需要来自传入 China Teams 活动的已存储会话引用，或 Azure China Bot Framework 频道边界（`*.botframework.azure.cn`）上的显式配置服务 URL。Graph 支持的 Teams 辅助功能目前对 `cloud: "China"` 禁用，直到 OpenClaw 将 Graph 请求路由到 Azure China Graph 端点。

### 格式

Teams Markdown 比 Slack 或 Discord 更受限：

- 基本格式可用：**粗体**、_斜体_、`code`、链接
- 复杂 Markdown（表格、嵌套列表）可能无法正确渲染
- Adaptive Cards 支持投票和语义呈现发送（见下文）

## 配置

关键设置（共享渠道模式见 `/gateway/configuration`）：

- `channels.msteams.enabled`：启用/禁用该渠道。
- `channels.msteams.appId`、`channels.msteams.appPassword`、`channels.msteams.tenantId`：bot 凭据。
- `channels.msteams.cloud`：Teams SDK 云环境（`Public`、`USGov`、`USGovDoD` 或 `China`；默认 `Public`）。对于 USGov/DoD SDK 云，请与 `serviceUrl` 一起设置；China 使用 SDK 预设和已存储的 Azure China Bot Framework 会话引用，Graph 支持的辅助功能会保持禁用，直到实现 Azure China Graph 路由。
- `channels.msteams.serviceUrl`：SDK 主动操作的 Bot Connector 服务 URL 边界。公有云使用 SDK 默认值；为 GCC（`https://smba.infra.gcc.teams.microsoft.com/teams`）、GCC High 或 DoD 设置此项。当已存储会话引用来自 21Vianet 运营的 Teams 时，China 接受 Azure China Bot Framework 频道主机。
- `channels.msteams.webhook.port`（默认 `3978`）
- `channels.msteams.webhook.path`（默认 `/api/messages`）
- `channels.msteams.dmPolicy`：`pairing | allowlist | open | disabled`（默认：pairing）
- `channels.msteams.allowFrom`：私信允许列表（建议使用 AAD 对象 ID）。Graph 访问可用时，向导会在设置期间将名称解析为 ID。
- `channels.msteams.dangerouslyAllowNameMatching`：紧急开关，用于重新启用可变 UPN/显示名称匹配和直接团队/频道名称路由。
- `channels.msteams.textChunkLimit`：出站文本分块大小。
- `channels.msteams.chunkMode`：`length`（默认）或 `newline`，用于在按长度分块前按空行（段落边界）拆分。
- `channels.msteams.mediaAllowHosts`：入站附件主机允许列表（默认包含 Microsoft/Teams 域名）。
- `channels.msteams.mediaAuthAllowHosts`：媒体重试时可附加 Authorization 标头的允许列表（默认包含 Graph + Bot Framework 主机）。
- `channels.msteams.requireMention`：要求频道/群组中 @提及（默认 true）。
- `channels.msteams.replyStyle`：`thread | top-level`（见 [回复样式](#reply-style-threads-vs-posts)）。
- `channels.msteams.teams.<teamId>.replyStyle`：按团队覆盖。
- `channels.msteams.teams.<teamId>.requireMention`：按团队覆盖。
- `channels.msteams.teams.<teamId>.tools`：当缺少频道覆盖时使用的默认按团队工具策略覆盖（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.toolsBySender`：默认按团队、按发送者的工具策略覆盖（支持 `"*"` 通配符）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`：按频道覆盖。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`：按频道覆盖。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`：按频道工具策略覆盖（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`：按频道、按发送者的工具策略覆盖（支持 `"*"` 通配符）。
- `toolsBySender` 键应使用显式前缀：
  `channel:`、`id:`、`e164:`、`username:`、`name:`（旧版无前缀键仍只映射到 `id:`）。
- `channels.msteams.actions.memberInfo`：启用或禁用 Graph 支持的成员信息操作（默认：Graph 凭据可用时启用）。
- `channels.msteams.authType`：身份验证类型 - `"secret"`（默认）或 `"federated"`。
- `channels.msteams.certificatePath`：PEM 证书文件路径（联合 + 证书身份验证）。
- `channels.msteams.certificateThumbprint`：证书指纹（可选，身份验证不需要）。
- `channels.msteams.useManagedIdentity`：启用托管身份身份验证（联合模式）。
- `channels.msteams.managedIdentityClientId`：用户分配托管身份的客户端 ID。
- `channels.msteams.sharePointSiteId`：群聊/频道中文件上传使用的 SharePoint 站点 ID（见 [在群聊中发送文件](#sending-files-in-group-chats)）。

## 路由和会话

- 会话键遵循标准 agent 格式（见 [/concepts/session](/zh-CN/concepts/session)）：
  - 直接消息共享主会话（`agent:<agentId>:<mainKey>`）。
  - 频道/群组消息使用会话 ID：
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 回复样式：线程与帖子

Teams 最近在相同底层数据模型上引入了两种频道 UI 样式：

| 样式                    | 描述                                               | 推荐的 `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **帖子**（经典）      | 消息显示为卡片，下方带有线程回复 | `thread`（默认）       |
| **线程**（类似 Slack） | 消息线性流动，更像 Slack                   | `top-level`              |

**问题：** Teams API 不会公开某个频道使用哪种 UI 样式。如果你使用了错误的 `replyStyle`：

- Threads 样式频道中的 `thread` → 回复会以不自然的嵌套方式显示
- Posts 样式频道中的 `top-level` → 回复会显示为单独的顶层帖子，而不是在线程中

**解决方案：** 根据频道的设置方式按频道配置 `replyStyle`：

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

当 bot 向频道发送回复时，`replyStyle` 会从最具体的覆盖项向下解析到默认值。第一个非 `undefined` 值生效：

1. **按频道** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **按团队** — `channels.msteams.teams.<teamId>.replyStyle`
3. **全局** — `channels.msteams.replyStyle`
4. **隐式默认值** — 从 `requireMention` 派生：
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

如果你全局设置 `requireMention: false`，但没有显式 `replyStyle`，Posts 样式频道中的提及会显示为顶层帖子，即使入站消息是线程回复。可在全局、团队或频道级别固定 `replyStyle: "thread"`，以避免意外。

### 线程上下文保留

当 `replyStyle: "thread"` 生效，并且 bot 是从频道线程内被 @提及时，OpenClaw 会将原始线程根重新附加到出站会话引用（`19:…@thread.tacv2;messageid=<root>`），让回复落在同一线程内。这同时适用于实时（轮次内）发送，以及 Bot Framework 轮次上下文过期后进行的主动发送（例如长时间运行的 agent、通过 `mcp__openclaw__message` 排队的工具调用回复）。

线程根来自会话引用中存储的 `threadId`。早于 `threadId` 的较旧存储引用会回退到 `activityId`（最后为会话播种的任意入站活动），因此现有部署无需重新播种即可继续工作。

当 `replyStyle: "top-level"` 生效时，频道线程入站消息会被有意作为新的顶级帖子回复，不会附加线程后缀。这是 Threads 风格频道的正确行为；如果你看到的是顶级帖子，但预期是线程回复，则说明该频道的 `replyStyle` 设置不正确。

## 附件和图片

**当前限制：**

- **私信：** 图片和文件附件通过 Teams Bot 文件 API 工作。
- **频道/群组：** 附件存储在 M365 存储（SharePoint/OneDrive）中。Webhook 载荷只包含 HTML 存根，不包含实际文件字节。**需要 Graph API 权限**才能下载频道附件。
- 对于明确以文件优先发送的场景，请使用带有 `media` / `filePath` / `path` 的 `action=upload-file`；可选的 `message` 会成为随附文本/评论，`filename` 会覆盖上传名称。

如果没有 Graph 权限，带图片的频道消息会以纯文本形式接收（Bot 无法访问图片内容）。
默认情况下，OpenClaw 只会从 Microsoft/Teams 主机名下载媒体。可用 `channels.msteams.mediaAllowHosts` 覆盖（使用 `["*"]` 允许任意主机）。
Authorization 标头只会附加到 `channels.msteams.mediaAuthAllowHosts` 中的主机（默认是 Graph + Bot Framework 主机）。保持此列表严格（避免多租户后缀）。

## 在群聊中发送文件

Bot 可以使用 FileConsentCard 流程（内置）在私信中发送文件。不过，**在群聊/频道中发送文件**需要额外设置：

| 上下文                   | 文件发送方式                                  | 所需设置                                        |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **私信**                 | FileConsentCard → 用户接受 → Bot 上传        | 开箱即用                                        |
| **群聊/频道**            | 上传到 SharePoint → 共享链接                 | 需要 `sharePointSiteId` + Graph 权限            |
| **图片（任意上下文）**   | Base64 编码内联                              | 开箱即用                                        |

### 为什么群聊需要 SharePoint

Bot 没有个人 OneDrive 驱动器（`/me/drive` Graph API 端点不适用于应用程序身份）。要在群聊/频道中发送文件，Bot 会上传到 **SharePoint 站点**并创建共享链接。

### 设置

1. 在 Entra ID（Azure AD）→ App Registration 中**添加 Graph API 权限**：
   - `Sites.ReadWrite.All`（Application）- 上传文件到 SharePoint
   - `Chat.Read.All`（Application）- 可选，启用按用户共享链接

2. 为租户**授予管理员同意**。

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

| 权限                                    | 共享行为                                                  |
| --------------------------------------- | --------------------------------------------------------- |
| 仅 `Sites.ReadWrite.All`                | 组织范围共享链接（组织内任何人都可访问）                  |
| `Sites.ReadWrite.All` + `Chat.Read.All` | 按用户共享链接（只有聊天成员可访问）                      |

按用户共享更安全，因为只有聊天参与者可以访问文件。如果缺少 `Chat.Read.All` 权限，Bot 会回退到组织范围共享。

### 回退行为

| 场景                                             | 结果                                               |
| ------------------------------------------------ | -------------------------------------------------- |
| 群聊 + 文件 + 已配置 `sharePointSiteId`          | 上传到 SharePoint，发送共享链接                    |
| 群聊 + 文件 + 未配置 `sharePointSiteId`          | 尝试 OneDrive 上传（可能失败），仅发送文本         |
| 个人聊天 + 文件                                  | FileConsentCard 流程（无需 SharePoint 即可工作）   |
| 任意上下文 + 图片                                | Base64 编码内联（无需 SharePoint 即可工作）        |

### 文件存储位置

上传的文件会存储在已配置 SharePoint 站点默认文档库中的 `/OpenClawShared/` 文件夹内。

## 投票（Adaptive Cards）

OpenClaw 以 Adaptive Cards 形式发送 Teams 投票（Teams 没有原生投票 API）。

- CLI：`openclaw message poll --channel msteams --target conversation:<id> ...`
- 投票由 Gateway 网关记录在 `state/openclaw.sqlite` 下的 OpenClaw 插件状态 SQLite 中。
- 现有 `msteams-polls.json` 文件由 `openclaw doctor --fix` 导入，而不是由正在运行的插件导入。
- Gateway 网关必须保持在线才能记录投票。
- 投票目前还不会自动发布结果摘要，也尚未支持投票结果 CLI。

## 呈现卡片

使用 `message` 工具、CLI 或普通回复投递，将语义化呈现载荷发送给 Teams 用户或会话。OpenClaw 会根据通用呈现契约将它们渲染为 Teams Adaptive Cards。

`presentation` 参数接受语义块。提供 `presentation` 时，消息文本是可选的。按钮会渲染为 Adaptive Card 提交或 URL 操作。Teams 渲染器目前还没有原生选择菜单，因此 OpenClaw 会在投递前将其降级为可读文本。

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

有关目标格式详情，请参见下方的[目标格式](#target-formats)。

## 目标格式

MSTeams 目标使用前缀来区分用户和会话：

| 目标类型            | 格式                             | 示例                                                |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| 用户（按 ID）       | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| 用户（按名称）      | `user:<display-name>`            | `user:John Smith`（需要 Graph API）                 |
| 群组/频道           | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| 群组/频道（原始）   | `<conversation-id>`              | `19:abc123...@thread.tacv2`（如果包含 `@thread`）   |

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
如果没有 `user:` 前缀，名称默认会按群组或团队解析。按显示名称定位人员时，请始终使用 `user:`。
</Note>

## 主动消息

- 主动消息只有在用户交互**之后**才可能发送，因为我们会在那时存储会话引用。
- 关于 `dmPolicy` 和允许列表门控，请参见 `/gateway/configuration`。

## 团队和频道 ID（常见坑）

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

- 团队键 = `/team/` 之后的路径片段（URL 解码后，例如 `19:Bk4j...@thread.tacv2`；较旧租户可能显示 `@thread.skype`，这也是有效的）
- 频道键 = `/channel/` 之后的路径片段（URL 解码后）
- **忽略** OpenClaw 路由中的 `groupId` 查询参数。它是 Microsoft Entra 群组 ID，而不是传入 Teams 活动中使用的 Bot Framework 会话 ID。

## 私有频道

Bot 对私有频道的支持有限：

| 功能                         | 标准频道 | 私有频道             |
| ---------------------------- | -------- | -------------------- |
| Bot 安装                     | 是       | 有限                 |
| 实时消息（Webhook）          | 是       | 可能无法工作         |
| RSC 权限                     | 是       | 行为可能有所不同     |
| @提及                        | 是       | 如果 Bot 可访问      |
| Graph API 历史记录           | 是       | 是（需要权限）       |

**如果私有频道无法工作，可采用的变通方法：**

1. 使用标准频道进行 Bot 交互
2. 使用私信 - 用户始终可以直接给 Bot 发消息
3. 使用 Graph API 访问历史记录（需要 `ChannelMessage.Read.All`）

## 故障排除

### 常见问题

- **频道中不显示图片：** 缺少 Graph 权限或管理员同意。重新安装 Teams 应用并完全退出/重新打开 Teams。
- **频道中没有响应：** 默认需要提及；设置 `channels.msteams.requireMention=false` 或按团队/频道配置。
- **版本不匹配（Teams 仍显示旧清单）：** 移除并重新添加应用，然后完全退出 Teams 以刷新。
- **Webhook 返回 401 Unauthorized：** 手动测试且没有 Azure JWT 时这是预期结果，表示端点可达但认证失败。请使用 Azure Web Chat 正确测试。

### 清单上传错误

- **“Icon file cannot be empty”：** 清单引用的图标文件为 0 字节。创建有效的 PNG 图标（`outline.png` 为 32x32，`color.png` 为 192x192）。
- **“webApplicationInfo.Id already in use”：** 该应用仍安装在其他团队/聊天中。请先找到并卸载它，或等待 5-10 分钟完成传播。
- **上传时出现“Something went wrong”：** 改用 [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) 上传，打开浏览器 DevTools（F12）→ Network 标签页，并检查响应正文中的实际错误。
- **侧载失败：** 尝试使用“Upload an app to your org's app catalog”，而不是“Upload a custom app”，这通常可以绕过侧载限制。

### RSC 权限不工作

1. 确认 `webApplicationInfo.id` 与你的机器人的 App ID 完全匹配
2. 重新上传应用，并在团队/聊天中重新安装
3. 检查你的组织管理员是否阻止了 RSC 权限
4. 确认你使用的是正确的范围：团队使用 `ChannelMessage.Read.Group`，群组聊天使用 `ChatMessage.Read.Chat`

## 参考资料

- [创建 Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot 设置指南
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - 创建/管理 Teams 应用
- [Teams 应用清单架构](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [使用 RSC 接收频道消息](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC 权限参考](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams 机器人文件处理](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4)（频道/群组需要 Graph）
- [主动消息传递](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - 用于机器人管理的 Teams CLI

## 相关

- [频道概览](/zh-CN/channels) - 所有支持的渠道
- [配对](/zh-CN/channels/pairing) - 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) - 群组聊天行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) - 消息的会话路由
- [安全](/zh-CN/gateway/security) - 访问模型和加固
