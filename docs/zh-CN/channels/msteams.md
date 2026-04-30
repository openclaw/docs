---
read_when:
    - 正在开发 Microsoft Teams 渠道功能
summary: Microsoft Teams 机器人支持状态、能力和配置
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-30T00:47:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2c8cd13a72941a18d609b1f7263d9b9ed3284873f9b1483975ca1356b543979
    source_path: channels/msteams.md
    workflow: 16
---

Status：支持文本 + 私信附件；渠道/群组文件发送需要 `sharePointSiteId` + Graph 权限（参见[在群聊中发送文件](#sending-files-in-group-chats)）。投票通过 Adaptive Cards 发送。消息操作会暴露显式的 `upload-file`，用于以文件优先的发送。

## 内置插件

Microsoft Teams 在当前 OpenClaw 版本中作为内置插件提供，因此普通打包构建中不需要
单独安装。

如果你使用的是较旧构建，或自定义安装中排除了内置 Teams，
请在发布后安装当前 npm 包：

```bash
openclaw plugins install @openclaw/msteams
```

如果 npm 报告 OpenClaw 所有的包已弃用，请使用当前打包的
OpenClaw 构建，或在更新的 npm 包发布前使用本地检出路径。

本地检出（从 git 仓库运行时）：

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

详情：[插件](/zh-CN/tools/plugin)

## 快速设置

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) 可以通过一条命令处理 bot 注册、manifest 创建和凭据生成。

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

如果你尚未安装并认证 devtunnel CLI，请先完成（[入门指南](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)）。

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
需要 `--allow-anonymous`，因为 Teams 无法使用 devtunnels 进行认证。每个传入的 bot 请求仍会由 Teams SDK 自动验证。
</Note>

替代方案：`ngrok http 3978` 或 `tailscale funnel 3978`（但这些可能每个会话都会更改 URL）。

**3. 创建应用**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

这一条命令会：

- 创建 Entra ID（Azure AD）应用程序
- 生成客户端密钥
- 构建并上传 Teams 应用 manifest（带图标）
- 注册 bot（默认由 Teams 管理，不需要 Azure 订阅）

输出会显示 `CLIENT_ID`、`CLIENT_SECRET`、`TENANT_ID` 和一个 **Teams App ID**，请记下它们以供后续步骤使用。它还会提供直接在 Teams 中安装应用的选项。

**4. 使用输出中的凭据配置 OpenClaw：**

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

`teams app create` 会提示你安装应用，请选择 “Install in Teams”。如果你跳过了，也可以稍后获取链接：

```bash
teams app get <teamsAppId> --install-link
```

**6. 验证一切正常**

```bash
teams app doctor <teamsAppId>
```

这会对 bot 注册、AAD 应用配置、manifest 有效性和 SSO 设置运行诊断。

对于生产部署，建议使用[联合认证](/zh-CN/channels/msteams#federated-authentication-certificate-plus-managed-identity)（证书或托管身份）替代客户端密钥。

<Note>
默认会阻止群聊（`channels.msteams.groupPolicy: "allowlist"`）。要允许群组回复，请设置 `channels.msteams.groupAllowFrom`，或使用 `groupPolicy: "open"` 允许任意成员（需要提及触发）。
</Note>

## 目标

- 通过 Teams 私信、群聊或渠道与 OpenClaw 对话。
- 保持路由确定性：回复始终返回到它们到达的渠道。
- 默认使用安全的渠道行为（除非另有配置，否则需要提及）。

## 配置写入

默认情况下，允许 Microsoft Teams 写入由 `/config set|unset` 触发的配置更新（需要 `commands.config: true`）。

通过以下方式禁用：

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## 访问控制（私信 + 群组）

**私信访问**

- 默认值：`channels.msteams.dmPolicy = "pairing"`。未知发送者会被忽略，直到获批。
- `channels.msteams.allowFrom` 应使用稳定的 AAD 对象 ID。
- 不要依赖 UPN/显示名称匹配来配置允许列表，因为它们可能会变化。OpenClaw 默认禁用直接名称匹配；如需启用，请显式设置 `channels.msteams.dangerouslyAllowNameMatching: true`。
- 当凭据允许时，向导可以通过 Microsoft Graph 将名称解析为 ID。

**群组访问**

- 默认值：`channels.msteams.groupPolicy = "allowlist"`（除非添加 `groupAllowFrom`，否则阻止）。使用 `channels.defaults.groupPolicy` 覆盖未设置时的默认值。
- `channels.msteams.groupAllowFrom` 控制哪些发送者可以在群聊/渠道中触发（回退到 `channels.msteams.allowFrom`）。
- 设置 `groupPolicy: "open"` 以允许任意成员（默认仍需要提及触发）。
- 要不允许**任何渠道**，请设置 `channels.msteams.groupPolicy: "disabled"`。

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

**Teams + 渠道允许列表**

- 通过在 `channels.msteams.teams` 下列出团队和渠道来限定群组/渠道回复范围。
- 键应使用来自 Teams 链接的稳定 Teams conversation ID，而不是可变的显示名称。
- 当 `groupPolicy="allowlist"` 且存在 teams 允许列表时，只接受列出的团队/渠道（需要提及触发）。
- 配置向导接受 `Team/Channel` 条目并为你保存。
- 启动时，OpenClaw 会将团队/渠道和用户允许列表名称解析为 ID（当 Graph 权限允许时）
  并记录映射；未解析的团队/渠道名称会按输入保留，但默认会在路由中忽略，除非启用 `channels.msteams.dangerouslyAllowNameMatching: true`。

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

如果你无法使用 Teams CLI，可以通过 Azure Portal 手动设置 bot。

### 工作原理

1. 确保 Microsoft Teams 插件可用（当前版本中已内置）。
2. 创建 **Azure Bot**（App ID + 密钥 + 租户 ID）。
3. 构建引用该 bot 并包含以下 RSC 权限的 **Teams 应用包**。
4. 将 Teams 应用上传/安装到团队中（或安装到用于私信的个人范围）。
5. 在 `~/.openclaw/openclaw.json`（或环境变量）中配置 `msteams` 并启动 Gateway 网关。
6. Gateway 网关默认在 `/api/messages` 上监听 Bot Framework webhook 流量。

### 步骤 1：创建 Azure Bot

1. 前往[创建 Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. 填写 **Basics** 标签页：

   | 字段               | 值                                                       |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | 你的 bot 名称，例如 `openclaw-msteams`（必须唯一）       |
   | **Subscription**   | 选择你的 Azure 订阅                                      |
   | **Resource group** | 新建或使用现有资源组                                     |
   | **Pricing tier**   | 开发/测试使用 **Free**                                   |
   | **Type of App**    | **Single Tenant**（推荐，见下方说明）                    |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
新建多租户 bot 已在 2025-07-31 后弃用。新 bot 请使用 **Single Tenant**。
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

### 步骤 4：启用 Teams 渠道

1. 在 Azure Bot → **Channels**
2. 点击 **Microsoft Teams** → Configure → Save
3. 接受服务条款

### 步骤 5：构建 Teams 应用 Manifest

- 包含一个 `bot` 条目，并设置 `botId = <App ID>`。
- 范围：`personal`、`team`、`groupChat`。
- `supportsFiles: true`（个人范围文件处理所需）。
- 添加 RSC 权限（见 [RSC 权限](#current-teams-rsc-permissions-manifest)）。
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

当插件可用且 `msteams` 配置包含凭据时，Teams 渠道会自动启动。

</details>

## 联合认证（证书加托管身份）

> 添加于 2026.4.11

对于生产部署，OpenClaw 支持**联合认证**，作为比客户端密钥更安全的替代方案。可用方法有两种：

### 选项 A：基于证书的认证

使用在你的 Entra ID 应用注册中注册的 PEM 证书。

**设置：**

1. 生成或获取证书（带私钥的 PEM 格式）。
2. 在 Entra ID → App Registration → **Certificates & secrets** → **Certificates** 中上传公钥证书。

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

### 选项 B：Azure Managed Identity

使用 Azure Managed Identity 进行无密码认证。这非常适合部署在 Azure 基础设施（AKS、App Service、Azure VMs）上且托管身份可用的场景。

**工作原理：**

1. bot pod/VM 具有托管身份（系统分配或用户分配）。
2. **联合身份凭据**将托管身份关联到 Entra ID 应用注册。
3. 运行时，OpenClaw 使用 `@azure/identity` 从 Azure IMDS 端点（`169.254.169.254`）获取令牌。
4. 该令牌会传递给 Teams SDK，用于 bot 认证。

**先决条件：**

- 启用了托管身份的 Azure 基础设施（AKS 工作负载身份、App Service、VM）
- 在 Entra ID 应用注册上创建了联合身份凭据
- pod/VM 可以通过网络访问 IMDS（`169.254.169.254:80`）

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

**配置（用户分配的托管标识）：**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>`（仅用于用户分配的标识）

### AKS 工作负载标识设置

对于使用工作负载标识的 AKS 部署：

1. 在你的 AKS 集群上**启用工作负载标识**。
2. 在 Entra ID 应用注册上**创建联合标识凭据**：

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. 使用应用客户端 ID **注解 Kubernetes 服务账户**：

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. 为工作负载标识注入**标记 pod**：

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **确保网络可访问** IMDS（`169.254.169.254`）——如果使用 NetworkPolicy，请添加一条出站规则，允许到 `169.254.169.254/32` 的 80 端口流量。

### 认证类型比较

| 方法                 | 配置                                           | 优点                               | 缺点                         |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ---------------------------- |
| **客户端密钥**       | `appPassword`                                  | 设置简单                           | 需要轮换密钥，安全性较低     |
| **证书**             | `authType: "federated"` + `certificatePath`    | 网络中不传输共享密钥               | 证书管理开销                 |
| **托管标识**         | `authType: "federated"` + `useManagedIdentity` | 无密码，无需管理密钥               | 需要 Azure 基础设施          |

**默认行为：**未设置 `authType` 时，OpenClaw 默认使用客户端密钥认证。现有配置无需更改即可继续工作。

## 本地开发（隧道）

Teams 无法访问 `localhost`。使用持久开发隧道，让你的 URL 在不同会话之间保持不变：

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

替代方案：`ngrok http 3978` 或 `tailscale funnel 3978`（URL 可能在每次会话中变化）。

如果你的隧道 URL 发生变化，请更新端点：

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## 测试 Bot

**运行诊断：**

```bash
teams app doctor <teamsAppId>
```

一次性检查 Bot 注册、AAD 应用、清单和 SSO 配置。

**发送测试消息：**

1. 安装 Teams 应用（使用 `teams app get <id> --install-link` 提供的安装链接）
2. 在 Teams 中找到 Bot 并发送私信
3. 检查 Gateway 网关日志中的传入活动

## 环境变量

所有配置键都可以改用环境变量设置：

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE`（可选：`"secret"` 或 `"federated"`）
- `MSTEAMS_CERTIFICATE_PATH`（联合 + 证书）
- `MSTEAMS_CERTIFICATE_THUMBPRINT`（可选，认证不需要）
- `MSTEAMS_USE_MANAGED_IDENTITY`（联合 + 托管标识）
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID`（仅用户分配的 MI）

## 成员信息操作

OpenClaw 为 Microsoft Teams 暴露了一个由 Graph 支持的 `member-info` 操作，使智能体和自动化可以直接从 Microsoft Graph 解析渠道成员详情（显示名称、电子邮件、角色）。

要求：

- `Member.Read.Group` RSC 权限（已包含在推荐清单中）
- 对于跨团队查找：需要带管理员同意的 `User.Read.All` Graph 应用程序权限

该操作由 `channels.msteams.actions.memberInfo` 控制（默认：当 Graph 凭据可用时启用）。

## 历史上下文

- `channels.msteams.historyLimit` 控制有多少最近的渠道/群组消息会被包装进提示。
- 回退到 `messages.groupChat.historyLimit`。设置为 `0` 可禁用（默认 50）。
- 获取的线程历史会按发送者允许列表（`allowFrom` / `groupAllowFrom`）过滤，因此线程上下文播种只包含来自允许发送者的消息。
- 引用的附件上下文（从 Teams 回复 HTML 派生的 `ReplyTo*`）目前会按收到时传递。
- 换句话说，允许列表控制谁可以触发智能体；目前只有特定的补充上下文路径会被过滤。
- 私信历史可以通过 `channels.msteams.dmHistoryLimit`（用户轮次）限制。按用户覆盖：`channels.msteams.dms["<user_id>"].historyLimit`。

## 当前 Teams RSC 权限（清单）

这些是我们 Teams 应用清单中**现有的 resourceSpecific 权限**。它们只在安装该应用的团队/聊天中生效。

**用于渠道（团队范围）：**

- `ChannelMessage.Read.Group`（应用程序）- 无需 @提及即可接收所有渠道消息
- `ChannelMessage.Send.Group`（应用程序）
- `Member.Read.Group`（应用程序）
- `Owner.Read.Group`（应用程序）
- `ChannelSettings.Read.Group`（应用程序）
- `TeamMember.Read.Group`（应用程序）
- `TeamSettings.Read.Group`（应用程序）

**用于群聊：**

- `ChatMessage.Read.Chat`（应用程序）- 无需 @提及即可接收所有群聊消息

要通过 Teams CLI 添加 RSC 权限：

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Teams 清单示例（已脱敏）

包含必需字段的最小有效示例。替换 ID 和 URL。

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

- `bots[].botId` **必须**与 Azure Bot 应用 ID 匹配。
- `webApplicationInfo.id` **必须**与 Azure Bot 应用 ID 匹配。
- `bots[].scopes` 必须包含你计划使用的界面（`personal`、`team`、`groupChat`）。
- 个人范围中的文件处理需要 `bots[].supportsFiles: true`。
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

更新后，在每个团队中重新安装应用，使新权限生效，并**完全退出并重新启动 Teams**（不只是关闭窗口），以清除缓存的应用元数据。

<details>
<summary>手动更新清单（不使用 CLI）</summary>

1. 使用新设置更新你的 `manifest.json`
2. **递增 `version` 字段**（例如，`1.0.0` → `1.1.0`）
3. 将清单与图标（`manifest.json`、`outline.png`、`color.png`）**重新压缩**
4. 上传新的 zip：
   - **Teams 管理中心：**Teams 应用 → 管理应用 → 找到你的应用 → 上传新版本
   - **旁加载：**在 Teams 中 → 应用 → 管理你的应用 → 上传自定义应用

</details>

## 能力：仅 RSC 与 Graph

### 仅使用 **Teams RSC**（已安装应用，无 Graph API 权限）

可用：

- 读取渠道消息**文本**内容。
- 发送渠道消息**文本**内容。
- 接收**个人（私信）**文件附件。

不可用：

- 渠道/群组**图片或文件内容**（载荷只包含 HTML 占位片段）。
- 下载存储在 SharePoint/OneDrive 中的附件。
- 读取消息历史（实时 webhook 事件之外）。

### 使用 **Teams RSC + Microsoft Graph 应用程序权限**

新增：

- 下载托管内容（粘贴到消息中的图片）。
- 下载存储在 SharePoint/OneDrive 中的文件附件。
- 通过 Graph 读取渠道/聊天消息历史。

### RSC 与 Graph API

| 能力                 | RSC 权限             | Graph API                           |
| -------------------- | -------------------- | ----------------------------------- |
| **实时消息**         | 是（通过 webhook）   | 否（仅轮询）                        |
| **历史消息**         | 否                   | 是（可查询历史）                    |
| **设置复杂度**       | 仅应用清单           | 需要管理员同意 + 令牌流程           |
| **离线工作**         | 否（必须正在运行）   | 是（随时查询）                      |

**结论：**RSC 用于实时监听；Graph API 用于历史访问。要在离线期间补收漏掉的消息，你需要带有 `ChannelMessage.Read.All` 的 Graph API（需要管理员同意）。

## 启用 Graph 的媒体 + 历史（渠道必需）

如果你需要**渠道**中的图片/文件，或想获取**消息历史**，必须启用 Microsoft Graph 权限并授予管理员同意。

1. 在 Entra ID（Azure AD）**应用注册**中，添加 Microsoft Graph **应用程序权限**：
   - `ChannelMessage.Read.All`（渠道附件 + 历史）
   - `Chat.Read.All` 或 `ChatMessage.Read.All`（群聊）
2. 为租户**授予管理员同意**。
3. 提升 Teams 应用**清单版本**，重新上传，并**在 Teams 中重新安装应用**。
4. **完全退出并重新启动 Teams**，以清除缓存的应用元数据。

**用户提及的额外权限：**对于会话中的用户，用户 @提及可直接工作。但是，如果你想动态搜索并提及**不在当前会话中**的用户，请添加 `User.Read.All`（应用程序）权限并授予管理员同意。

## 已知限制

### Webhook 超时

Teams 通过 HTTP webhook 传递消息。如果处理耗时过长（例如 LLM 响应较慢），你可能会看到：

- Gateway 网关超时
- Teams 重试消息（导致重复）
- 回复丢失

OpenClaw 通过快速返回并主动发送回复来处理这一点，但非常慢的响应仍可能导致问题。

### 格式

Teams Markdown 比 Slack 或 Discord 更受限制：

- 基本格式可用：**粗体**、_斜体_、`code`、链接
- 复杂 Markdown（表格、嵌套列表）可能无法正确渲染
- Adaptive Cards 支持用于投票和语义化演示发送（见下文）

## 配置

关键设置（共享渠道模式见 `/gateway/configuration`）：

- `channels.msteams.enabled`：启用/禁用该渠道。
- `channels.msteams.appId`、`channels.msteams.appPassword`、`channels.msteams.tenantId`：机器人凭证。
- `channels.msteams.webhook.port`（默认 `3978`）
- `channels.msteams.webhook.path`（默认 `/api/messages`）
- `channels.msteams.dmPolicy`：`pairing | allowlist | open | disabled`（默认：pairing）
- `channels.msteams.allowFrom`：私信允许列表（推荐使用 AAD 对象 ID）。当 Graph 访问可用时，向导会在设置期间将名称解析为 ID。
- `channels.msteams.dangerouslyAllowNameMatching`：紧急开关，用于重新启用可变 UPN/显示名称匹配和直接团队/渠道名称路由。
- `channels.msteams.textChunkLimit`：出站文本分块大小。
- `channels.msteams.chunkMode`：`length`（默认）或 `newline`，用于在按长度分块前按空行（段落边界）拆分。
- `channels.msteams.mediaAllowHosts`：入站附件主机允许列表（默认为 Microsoft/Teams 域名）。
- `channels.msteams.mediaAuthAllowHosts`：允许在媒体重试时附加 Authorization 标头的主机允许列表（默认为 Graph + Bot Framework 主机）。
- `channels.msteams.requireMention`：在渠道/群组中要求 @mention（默认 true）。
- `channels.msteams.replyStyle`：`thread | top-level`（见[回复样式](#reply-style-threads-vs-posts)）。
- `channels.msteams.teams.<teamId>.replyStyle`：按团队覆盖。
- `channels.msteams.teams.<teamId>.requireMention`：按团队覆盖。
- `channels.msteams.teams.<teamId>.tools`：当缺少渠道覆盖时使用的默认按团队工具策略覆盖（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.toolsBySender`：默认按团队、按发送者的工具策略覆盖（支持 `"*"` 通配符）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`：按渠道覆盖。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`：按渠道覆盖。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`：按渠道的工具策略覆盖（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`：按渠道、按发送者的工具策略覆盖（支持 `"*"` 通配符）。
- `toolsBySender` 键应使用显式前缀：
  `id:`、`e164:`、`username:`、`name:`（旧版无前缀键仍只映射到 `id:`）。
- `channels.msteams.actions.memberInfo`：启用或禁用由 Graph 支持的成员信息操作（默认：当 Graph 凭证可用时启用）。
- `channels.msteams.authType`：身份验证类型 —— `"secret"`（默认）或 `"federated"`。
- `channels.msteams.certificatePath`：PEM 证书文件路径（联合 + 证书身份验证）。
- `channels.msteams.certificateThumbprint`：证书指纹（可选，身份验证不需要）。
- `channels.msteams.useManagedIdentity`：启用托管身份身份验证（联合模式）。
- `channels.msteams.managedIdentityClientId`：用户分配托管身份的客户端 ID。
- `channels.msteams.sharePointSiteId`：用于群聊/渠道中文件上传的 SharePoint 站点 ID（见[在群聊中发送文件](#sending-files-in-group-chats)）。

## 路由与会话

- 会话键遵循标准智能体格式（见 [/concepts/session](/zh-CN/concepts/session)）：
  - 直接消息共享主会话（`agent:<agentId>:<mainKey>`）。
  - 渠道/群组消息使用 conversation id：
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 回复样式：线程与帖子

Teams 最近在同一个底层数据模型上引入了两种渠道 UI 样式：

| 样式                     | 描述                                   | 推荐的 `replyStyle`  |
| ------------------------ | -------------------------------------- | -------------------- |
| **帖子**（经典）         | 消息显示为卡片，下方带有线程回复       | `thread`（默认）     |
| **线程**（类似 Slack）   | 消息线性流动，更像 Slack               | `top-level`          |

**问题：** Teams API 不会暴露渠道使用的是哪种 UI 样式。如果使用了错误的 `replyStyle`：

- 线程样式渠道中的 `thread` → 回复会以别扭的嵌套形式显示
- 帖子样式渠道中的 `top-level` → 回复会显示为单独的顶层帖子，而不是线程内回复

**解决方案：** 根据渠道的设置方式按渠道配置 `replyStyle`：

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

- **私信：** 图片和文件附件通过 Teams 机器人文件 API 工作。
- **渠道/群组：** 附件位于 M365 存储（SharePoint/OneDrive）中。Webhook 负载只包含 HTML 存根，不包含实际文件字节。**需要 Graph API 权限**才能下载渠道附件。
- 对于显式文件优先发送，使用带有 `media` / `filePath` / `path` 的 `action=upload-file`；可选的 `message` 会成为随附文本/评论，`filename` 会覆盖上传名称。

没有 Graph 权限时，带图片的渠道消息会以纯文本形式接收（机器人无法访问图片内容）。
默认情况下，OpenClaw 只从 Microsoft/Teams 主机名下载媒体。可用 `channels.msteams.mediaAllowHosts` 覆盖（使用 `["*"]` 允许任何主机）。
Authorization 标头只会附加到 `channels.msteams.mediaAuthAllowHosts` 中的主机（默认为 Graph + Bot Framework 主机）。请保持此列表严格（避免多租户后缀）。

## 在群聊中发送文件

机器人可以使用 FileConsentCard 流程（内置）在私信中发送文件。不过，**在群聊/渠道中发送文件**需要额外设置：

| 上下文                   | 文件发送方式                                 | 所需设置                                        |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **私信**                 | FileConsentCard → 用户接受 → 机器人上传      | 开箱即用                                        |
| **群聊/渠道**            | 上传到 SharePoint → 共享链接                 | 需要 `sharePointSiteId` + Graph 权限            |
| **图片（任何上下文）**   | Base64 编码内联                              | 开箱即用                                        |

### 为什么群聊需要 SharePoint

机器人没有个人 OneDrive 驱动器（`/me/drive` Graph API 端点不适用于应用程序身份）。要在群聊/渠道中发送文件，机器人会上传到一个 **SharePoint 站点**并创建共享链接。

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

| 权限                                    | 共享行为                                      |
| --------------------------------------- | --------------------------------------------- |
| 仅 `Sites.ReadWrite.All`                | 组织范围共享链接（组织内任何人都可访问）      |
| `Sites.ReadWrite.All` + `Chat.Read.All` | 按用户共享链接（只有聊天成员可以访问）        |

按用户共享更安全，因为只有聊天参与者可以访问文件。如果缺少 `Chat.Read.All` 权限，机器人会回退到组织范围共享。

### 回退行为

| 场景                                            | 结果                                               |
| ----------------------------------------------- | -------------------------------------------------- |
| 群聊 + 文件 + 已配置 `sharePointSiteId`         | 上传到 SharePoint，发送共享链接                    |
| 群聊 + 文件 + 无 `sharePointSiteId`             | 尝试 OneDrive 上传（可能失败），仅发送文本         |
| 个人聊天 + 文件                                 | FileConsentCard 流程（无需 SharePoint 即可工作）   |
| 任何上下文 + 图片                               | Base64 编码内联（无需 SharePoint 即可工作）        |

### 文件存储位置

上传的文件存储在已配置 SharePoint 站点默认文档库中的 `/OpenClawShared/` 文件夹内。

## 投票（Adaptive Cards）

OpenClaw 将 Teams 投票作为 Adaptive Cards 发送（没有原生 Teams 投票 API）。

- CLI：`openclaw message poll --channel msteams --target conversation:<id> ...`
- 投票由 Gateway 网关记录在 `~/.openclaw/msteams-polls.json` 中。
- Gateway 网关必须保持在线才能记录投票。
- 投票尚不会自动发布结果摘要（如有需要，请检查存储文件）。

## 演示卡片

使用 `message` 工具或 CLI 向 Teams 用户或对话发送语义化演示负载。OpenClaw 会根据通用演示契约将它们渲染为 Teams Adaptive Cards。

`presentation` 参数接受语义块。提供 `presentation` 时，消息文本是可选的。

**智能体工具：**

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

目标格式详情见下方[目标格式](#target-formats)。

## 目标格式

MSTeams 目标使用前缀区分用户和对话：

| 目标类型              | 格式                             | 示例                                                |
| --------------------- | -------------------------------- | --------------------------------------------------- |
| 用户（按 ID）         | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| 用户（按名称）        | `user:<display-name>`            | `user:John Smith`（需要 Graph API）                 |
| 群组/渠道             | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| 群组/渠道（原始）     | `<conversation-id>`              | `19:abc123...@thread.tacv2`（如果包含 `@thread`）   |

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
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello" }],
  },
}
```

<Note>
没有 `user:` 前缀时，名称默认按群组或团队解析。按显示名称指定人员时，请始终使用 `user:`。
</Note>

## 主动消息传递

- 主动消息只有在用户交互**之后**才可用，因为我们会在此时存储会话引用。
- 请参阅 `/gateway/configuration`，了解 `dmPolicy` 和允许列表门控。

## 团队和渠道 ID（常见坑点）

Teams URL 中的 `groupId` 查询参数**不是**用于配置的团队 ID。请改为从 URL 路径中提取 ID：

**团队 URL：**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**渠道 URL：**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**用于配置：**

- 团队键 = `/team/` 之后的路径片段（URL 解码后，例如 `19:Bk4j...@thread.tacv2`；较旧租户可能显示 `@thread.skype`，这同样有效）
- 渠道键 = `/channel/` 之后的路径片段（URL 解码后）
- 对 OpenClaw 路由而言，请**忽略** `groupId` 查询参数。它是 Microsoft Entra 群组 ID，而不是传入 Teams 活动中使用的 Bot Framework 会话 ID。

## 私有渠道

机器人在私有渠道中的支持有限：

| 功能                         | 标准渠道 | 私有渠道             |
| ---------------------------- | -------- | -------------------- |
| 机器人安装                   | 是       | 有限                 |
| 实时消息（webhook）          | 是       | 可能无法工作         |
| RSC 权限                     | 是       | 行为可能不同         |
| @mentions                    | 是       | 如果机器人可访问     |
| Graph API 历史记录           | 是       | 是（需要权限）       |

**如果私有渠道无法工作，可使用的变通方法：**

1. 使用标准渠道进行机器人交互
2. 使用私信，用户始终可以直接给机器人发消息
3. 使用 Graph API 访问历史记录（需要 `ChannelMessage.Read.All`）

## 故障排除

### 常见问题

- **渠道中不显示图片：**缺少 Graph 权限或管理员同意。重新安装 Teams 应用，并完全退出后重新打开 Teams。
- **渠道中没有响应：**默认需要提及；设置 `channels.msteams.requireMention=false` 或按团队/渠道配置。
- **版本不匹配（Teams 仍显示旧清单）：**移除并重新添加应用，然后完全退出 Teams 以刷新。
- **webhook 返回 401 Unauthorized：**手动测试时如果没有 Azure JWT，这是预期结果，表示端点可访问但认证失败。请使用 Azure Web Chat 正确测试。

### 清单上传错误

- **“Icon file cannot be empty”：**清单引用的图标文件为 0 字节。创建有效的 PNG 图标（`outline.png` 为 32x32，`color.png` 为 192x192）。
- **“webApplicationInfo.Id already in use”：**该应用仍安装在另一个团队/聊天中。请先找到并卸载它，或等待 5-10 分钟让变更传播。
- **上传时显示“Something went wrong”：**改用 [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) 上传，打开浏览器 DevTools（F12）→ Network 选项卡，并检查响应正文中的实际错误。
- **旁加载失败：**尝试使用“Upload an app to your org's app catalog”，而不是“Upload a custom app”；这通常可以绕过旁加载限制。

### RSC 权限无法工作

1. 验证 `webApplicationInfo.id` 是否与你的机器人 App ID 完全匹配
2. 重新上传应用，并在团队/聊天中重新安装
3. 检查你的组织管理员是否阻止了 RSC 权限
4. 确认你使用的是正确作用域：团队使用 `ChannelMessage.Read.Group`，群组聊天使用 `ChatMessage.Read.Chat`

## 参考资料

- [创建 Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot 设置指南
- [Teams 开发者门户](https://dev.teams.microsoft.com/apps) - 创建/管理 Teams 应用
- [Teams 应用清单架构](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [使用 RSC 接收渠道消息](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC 权限参考](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams 机器人文件处理](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4)（渠道/群组需要 Graph）
- [主动消息传递](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - 用于机器人管理的 Teams CLI

## 相关

- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信认证和配对流程
- [群组](/zh-CN/channels/groups) — 群组聊天行为和提及门控
- [渠道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型和加固
