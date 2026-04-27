---
read_when:
    - 正在开发 Microsoft Teams 渠道功能
summary: Microsoft Teams 机器人支持状态、功能和配置
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-27T07:11:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e11562a30a71ae92b677ac3cf1c6b96b925d4064bfce5fd325da13489c98f99
    source_path: channels/msteams.md
    workflow: 15
---

状态：支持文本 + 私信附件；渠道/群组文件发送需要 `sharePointSiteId` + Graph 权限（参见[在群聊中发送文件](#sending-files-in-group-chats)）。投票通过 Adaptive Cards 发送。消息操作公开显式的 `upload-file`，用于以文件为优先的发送。

## 内置插件

Microsoft Teams 在当前的 OpenClaw 版本中作为内置插件提供，因此在常规打包构建中不需要单独安装。

如果你使用的是较旧版本，或使用排除了内置 Teams 的自定义安装，请手动安装：

```bash
openclaw plugins install @openclaw/msteams
```

本地检出版本（从 git 仓库运行时）：

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

详情：[插件](/zh-CN/tools/plugin)

## 快速开始

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) 可通过单条命令完成机器人注册、manifest 创建和凭证生成。

**1. 安装并登录**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # 验证你已登录并看到你的租户信息
```

<Note>
Teams CLI 当前仍处于预览阶段。命令和标志可能会在不同版本之间发生变化。
</Note>

**2. 启动隧道**（Teams 无法访问 localhost）

如果你还没有安装，请先安装并完成 devtunnel CLI 的认证（参见[入门指南](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)）。

```bash
# 一次性设置（跨会话持久 URL）：
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# 每次开发会话：
devtunnel host my-openclaw-bot
# 你的端点：https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` 是必需的，因为 Teams 无法使用 devtunnels 进行身份验证。每个传入的机器人请求仍会由 Teams SDK 自动验证。
</Note>

替代方案：`ngrok http 3978` 或 `tailscale funnel 3978`（但这些可能会在每次会话中更改 URL）。

**3. 创建应用**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

这一条命令会：

- 创建 Entra ID（Azure AD）应用
- 生成客户端密钥
- 构建并上传 Teams 应用 manifest（含图标）
- 注册机器人（默认由 Teams 托管——不需要 Azure 订阅）

输出中会显示 `CLIENT_ID`、`CLIENT_SECRET`、`TENANT_ID` 和一个 **Teams App ID** ——请记下这些信息，用于后续步骤。它还会提供直接在 Teams 中安装应用的选项。

**4. 使用输出中的凭证配置 OpenClaw：**

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

`teams app create` 会提示你安装应用——选择“Install in Teams”。如果你跳过了这一步，之后可以获取链接：

```bash
teams app get <teamsAppId> --install-link
```

**6. 验证一切正常**

```bash
teams app doctor <teamsAppId>
```

这会对机器人注册、AAD 应用配置、manifest 有效性和 SSO 设置进行诊断。

对于生产部署，建议考虑使用[联合身份验证](#federated-authentication-certificate--managed-identity)（证书或托管身份）来替代客户端密钥。

<Note>
默认会阻止群聊（`channels.msteams.groupPolicy: "allowlist"`）。若要允许群组回复，请设置 `channels.msteams.groupAllowFrom`，或使用 `groupPolicy: "open"` 以允许任何成员（默认仍需提及）。
</Note>

## 目标

- 通过 Teams 私信、群聊或渠道与 OpenClaw 对话。
- 保持路由确定性：回复始终返回消息到达时所在的渠道。
- 默认采用安全的渠道行为（除非另有配置，否则需要提及）。

## 配置写入

默认情况下，Microsoft Teams 被允许写入由 `/config set|unset` 触发的配置更新（需要 `commands.config: true`）。

可通过以下方式禁用：

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## 访问控制（私信 + 群组）

**私信访问**

- 默认：`channels.msteams.dmPolicy = "pairing"`。未知发送者在获批前会被忽略。
- `channels.msteams.allowFrom` 应使用稳定的 AAD 对象 ID。
- 不要依赖 UPN/显示名称匹配来做允许列表——这些值可能会变化。OpenClaw 默认禁用直接名称匹配；如需启用，请显式设置 `channels.msteams.dangerouslyAllowNameMatching: true`。
- 当凭证允许时，向导可通过 Microsoft Graph 将名称解析为 ID。

**群组访问**

- 默认：`channels.msteams.groupPolicy = "allowlist"`（除非你添加 `groupAllowFrom`，否则会被阻止）。若未设置，可使用 `channels.defaults.groupPolicy` 覆盖默认值。
- `channels.msteams.groupAllowFrom` 控制哪些发送者可以在群聊/渠道中触发（回退到 `channels.msteams.allowFrom`）。
- 设置 `groupPolicy: "open"` 可允许任何成员（默认仍需提及）。
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

**Teams + 渠道允许列表**

- 可通过在 `channels.msteams.teams` 下列出团队和渠道来限定群组/渠道回复范围。
- 键应使用稳定的团队 ID 和渠道会话 ID。
- 当 `groupPolicy="allowlist"` 且存在团队允许列表时，只接受列出的团队/渠道（默认仍需提及）。
- 配置向导接受 `Team/Channel` 条目并会为你存储。
- 启动时，OpenClaw 会将团队/渠道以及用户允许列表中的名称解析为 ID（当 Graph 权限允许时），并记录映射；无法解析的团队/渠道名称会按输入保留，但默认会在路由中被忽略，除非启用 `channels.msteams.dangerouslyAllowNameMatching: true`。

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

如果你无法使用 Teams CLI，也可以通过 Azure 门户手动设置机器人。

### 工作原理

1. 确保 Microsoft Teams 插件可用（当前版本中为内置）。
2. 创建一个 **Azure Bot**（App ID + 密钥 + tenant ID）。
3. 构建一个 **Teams 应用包**，引用该机器人并包含下方的 RSC 权限。
4. 将 Teams 应用上传/安装到某个团队中（或安装到个人范围用于私信）。
5. 在 `~/.openclaw/openclaw.json` 中配置 `msteams`（或使用环境变量），然后启动 Gateway 网关。
6. Gateway 网关 默认在 `/api/messages` 上监听 Bot Framework webhook 流量。

### 第 1 步：创建 Azure Bot

1. 前往 [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. 填写 **Basics** 选项卡：

   | 字段 | 值 |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle** | 你的机器人名称，例如 `openclaw-msteams`（必须唯一） |
   | **Subscription** | 选择你的 Azure 订阅 |
   | **Resource group** | 新建或使用现有资源组 |
   | **Pricing tier** | 开发/测试使用 **Free** |
   | **Type of App** | **Single Tenant**（推荐——见下方说明） |
   | **Creation type** | **Create new Microsoft App ID** |

<Warning>
新建多租户机器人的功能在 2025-07-31 之后已弃用。新机器人请使用 **Single Tenant**。
</Warning>

3. 点击 **Review + create** → **Create**（等待约 1-2 分钟）

### 第 2 步：获取凭证

1. 前往你的 Azure Bot 资源 → **Configuration**
2. 复制 **Microsoft App ID** → 这就是你的 `appId`
3. 点击 **Manage Password** → 进入 App Registration
4. 在 **Certificates & secrets** 下 → **New client secret** → 复制 **Value** → 这就是你的 `appPassword`
5. 前往 **Overview** → 复制 **Directory (tenant) ID** → 这就是你的 `tenantId`

### 第 3 步：配置消息端点

1. 在 Azure Bot 中 → **Configuration**
2. 将 **Messaging endpoint** 设置为你的 webhook URL：
   - 生产环境：`https://your-domain.com/api/messages`
   - 本地开发：使用隧道（参见下方[本地开发](#local-development-tunneling)）

### 第 4 步：启用 Teams 渠道

1. 在 Azure Bot 中 → **Channels**
2. 点击 **Microsoft Teams** → Configure → Save
3. 接受服务条款

### 第 5 步：构建 Teams 应用 Manifest

- 包含一个 `bot` 条目，并设置 `botId = <App ID>`。
- 作用域：`personal`、`team`、`groupChat`。
- `supportsFiles: true`（个人作用域文件处理所必需）。
- 添加 RSC 权限（参见[当前 Teams RSC 权限 Manifest](#current-teams-rsc-permissions-manifest)）。
- 创建图标：`outline.png`（32x32）和 `color.png`（192x192）。
- 将这三个文件一起打包为 zip：`manifest.json`、`outline.png`、`color.png`。

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

当插件可用且存在带凭证的 `msteams` 配置时，Teams 渠道会自动启动。

</details>

## 联合身份验证（证书加托管身份）

> 添加于 2026.3.24

对于生产部署，OpenClaw 支持 **联合身份验证** 作为客户端密钥之外更安全的替代方案。提供两种方式：

### 选项 A：基于证书的身份验证

使用注册到你的 Entra ID 应用注册中的 PEM 证书。

**设置：**

1. 生成或获取证书（包含私钥的 PEM 格式）。
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

使用 Azure Managed Identity 实现无密码身份验证。这非常适合部署在 Azure 基础设施上的场景（AKS、App Service、Azure VM），这些环境中可提供托管身份。

**工作原理：**

1. 机器人 pod/VM 拥有一个托管身份（系统分配或用户分配）。
2. 一个 **联合身份凭证** 将该托管身份关联到 Entra ID 应用注册。
3. 运行时，OpenClaw 使用 `@azure/identity` 从 Azure IMDS 端点（`169.254.169.254`）获取令牌。
4. 该令牌会传递给 Teams SDK 用于机器人身份验证。

**前提条件：**

- 已启用托管身份的 Azure 基础设施（AKS workload identity、App Service、VM）
- 已在 Entra ID 应用注册上创建联合身份凭证
- pod/VM 可网络访问 IMDS（`169.254.169.254:80`）

**配置（系统分配托管身份）：**

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

**配置（用户分配托管身份）：**

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

### AKS Workload Identity 设置

对于使用 workload identity 的 AKS 部署：

1. 在你的 AKS 集群上**启用 workload identity**。
2. 在 Entra ID 应用注册上**创建联合身份凭证**：

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. 使用应用客户端 ID 为 **Kubernetes service account 添加注解**：

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. 为 **pod 添加标签** 以启用 workload identity 注入：

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **确保可访问 IMDS**（`169.254.169.254`）——如果使用 `NetworkPolicy`，请添加一条出口规则，允许到 `169.254.169.254/32` 的 80 端口流量。

### authType 对比

| 方法 | 配置 | 优点 | 缺点 |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **客户端密钥** | `appPassword` | 设置简单 | 需要轮换密钥，安全性较低 |
| **证书** | `authType: "federated"` + `certificatePath` | 网络中不传输共享密钥 | 证书管理有额外开销 |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | 无密码，无需管理密钥 | 需要 Azure 基础设施 |

**默认行为：** 当未设置 `authType` 时，OpenClaw 默认使用客户端密钥身份验证。现有配置无需修改即可继续使用。

## 本地开发（隧道）

Teams 无法访问 `localhost`。请使用持久化开发隧道，这样你的 URL 在不同会话之间保持不变：

```bash
# 一次性设置：
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# 每次开发会话：
devtunnel host my-openclaw-bot
```

替代方案：`ngrok http 3978` 或 `tailscale funnel 3978`（URL 可能会在每次会话中变化）。

如果你的隧道 URL 发生变化，请更新端点：

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## 测试机器人

**运行诊断：**

```bash
teams app doctor <teamsAppId>
```

它会一次性检查机器人注册、AAD 应用、manifest 和 SSO 配置。

**发送测试消息：**

1. 安装 Teams 应用（使用 `teams app get <id> --install-link` 返回的安装链接）
2. 在 Teams 中找到该机器人并发送一条私信
3. 检查 Gateway 网关 日志中的传入 activity

## 环境变量

所有配置键也可以通过环境变量设置：

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE`（可选：`"secret"` 或 `"federated"`）
- `MSTEAMS_CERTIFICATE_PATH`（联合身份验证 + 证书）
- `MSTEAMS_CERTIFICATE_THUMBPRINT`（可选，身份验证不要求）
- `MSTEAMS_USE_MANAGED_IDENTITY`（联合身份验证 + 托管身份）
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID`（仅用户分配的 MI）

## 成员信息操作

OpenClaw 为 Microsoft Teams 提供了基于 Graph 的 `member-info` 操作，因此智能体和自动化可以直接从 Microsoft Graph 解析渠道成员详情（显示名称、邮箱、角色）。

要求：

- `Member.Read.Group` RSC 权限（已包含在推荐的 manifest 中）
- 对于跨团队查询：需要 `User.Read.All` Graph 应用程序权限并已授予管理员同意

该操作受 `channels.msteams.actions.memberInfo` 控制（默认：当 Graph 凭证可用时启用）。

## 历史上下文

- `channels.msteams.historyLimit` 控制会包装进提示中的最近渠道/群组消息数量。
- 回退到 `messages.groupChat.historyLimit`。设置为 `0` 可禁用（默认值为 50）。
- 获取到的线程历史会按发送者允许列表（`allowFrom` / `groupAllowFrom`）进行过滤，因此线程上下文预填充目前只包含来自允许发送者的消息。
- 引用附件上下文（从 Teams 回复 HTML 派生的 `ReplyTo*`）当前会按接收时的原样传递。
- 换句话说，允许列表会控制谁可以触发智能体；当前只有特定的补充上下文路径会被过滤。
- 私信历史可通过 `channels.msteams.dmHistoryLimit`（用户轮次）限制。按用户覆盖：`channels.msteams.dms["<user_id>"].historyLimit`。

## 当前 Teams RSC 权限（manifest）

这些是我们 Teams 应用 manifest 中**现有的 resourceSpecific 权限**。它们仅在安装了应用的团队/聊天内部生效。

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

若要通过 Teams CLI 添加 RSC 权限：

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## 示例 Teams manifest（已脱敏）

包含所需字段的最小有效示例。请替换其中的 ID 和 URL。

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

### Manifest 注意事项（必需字段）

- `bots[].botId` **必须**与 Azure Bot App ID 匹配。
- `webApplicationInfo.id` **必须**与 Azure Bot App ID 匹配。
- `bots[].scopes` 必须包含你计划使用的界面范围（`personal`、`team`、`groupChat`）。
- `bots[].supportsFiles: true` 是个人范围文件处理所必需的。
- 如果你希望处理渠道流量，`authorization.permissions.resourceSpecific` 必须包含渠道读取/发送权限。

### 更新现有应用

若要更新一个已经安装的 Teams 应用（例如添加 RSC 权限）：

```bash
# 下载、编辑并重新上传 manifest
teams app manifest download <teamsAppId> manifest.json
# 在本地编辑 manifest.json...
teams app manifest upload manifest.json <teamsAppId>
# 如果内容发生变化，版本号会自动递增
```

更新后，请在每个团队中重新安装该应用，以使新权限生效，并且要**完全退出并重新启动 Teams**（而不只是关闭窗口），以清除缓存的应用元数据。

<details>
<summary>手动更新 manifest（不使用 CLI）</summary>

1. 用新设置更新你的 `manifest.json`
2. **递增 `version` 字段**（例如 `1.0.0` → `1.1.0`）
3. **重新打包为 zip**，包含 manifest 和图标（`manifest.json`、`outline.png`、`color.png`）
4. 上传新的 zip：
   - **Teams Admin Center：** Teams apps → Manage apps → 找到你的应用 → Upload new version
   - **旁加载：** 在 Teams 中 → Apps → Manage your apps → Upload a custom app

</details>

## 功能：仅 RSC 与 Graph

### 仅使用 **Teams RSC**（已安装应用，无 Graph API 权限）

可用：

- 读取渠道消息**文本**内容。
- 发送渠道消息**文本**内容。
- 接收**个人（私信）**文件附件。

不可用：

- 渠道/群组中的**图片或文件内容**（payload 仅包含 HTML 占位内容）。
- 下载存储在 SharePoint/OneDrive 中的附件。
- 读取消息历史（超出实时 webhook 事件范围的部分）。

### 使用 **Teams RSC + Microsoft Graph 应用程序权限**

额外支持：

- 下载托管内容（粘贴到消息中的图片）。
- 下载存储在 SharePoint/OneDrive 中的文件附件。
- 通过 Graph 读取渠道/聊天消息历史。

### RSC 与 Graph API

| 能力 | RSC 权限 | Graph API |
| ----------------------- | -------------------- | ----------------------------------- |
| **实时消息** | 是（通过 webhook） | 否（仅轮询） |
| **历史消息** | 否 | 是（可查询历史） |
| **设置复杂度** | 仅应用 manifest | 需要管理员同意 + 令牌流程 |
| **离线可用** | 否（必须在运行中） | 是（可随时查询） |

**结论：** RSC 用于实时监听；Graph API 用于访问历史记录。如果你希望在离线时补回错过的消息，则需要使用具备 `ChannelMessage.Read.All` 的 Graph API（需要管理员同意）。

## 启用 Graph 的媒体 + 历史记录（渠道必需）

如果你在**渠道**中需要图片/文件，或者想获取**消息历史记录**，则必须启用 Microsoft Graph 权限并授予管理员同意。

1. 在 Entra ID（Azure AD）**应用注册**中添加 Microsoft Graph **应用程序权限**：
   - `ChannelMessage.Read.All`（渠道附件 + 历史记录）
   - `Chat.Read.All` 或 `ChatMessage.Read.All`（群聊）
2. 为租户**授予管理员同意**。
3. 递增 Teams 应用 **manifest 版本**，重新上传，并在 Teams 中**重新安装应用**。
4. **完全退出并重新启动 Teams**，以清除缓存的应用元数据。

**用户提及的额外权限：** 对于当前会话中的用户，用户 @mentions 可直接使用。但是，如果你想动态搜索并提及**当前会话之外**的用户，请添加 `User.Read.All`（Application）权限并授予管理员同意。

## 已知限制

### Webhook 超时

Teams 通过 HTTP webhook 传递消息。如果处理耗时过长（例如 LLM 响应较慢），你可能会看到：

- Gateway 网关 超时
- Teams 重试消息（导致重复）
- 回复丢失

OpenClaw 通过快速返回并主动发送回复来处理这个问题，但在响应非常慢时仍可能出现问题。

### 格式化

Teams markdown 的能力比 Slack 或 Discord 更有限：

- 基础格式可用：**粗体**、_斜体_、`code`、链接
- 复杂 markdown（表格、嵌套列表）可能无法正确渲染
- 支持将 Adaptive Cards 用于投票和语义化展示发送（见下文）

## 配置

关键设置（共享渠道模式参见 `/gateway/configuration`）：

- `channels.msteams.enabled`：启用/禁用该渠道。
- `channels.msteams.appId`、`channels.msteams.appPassword`、`channels.msteams.tenantId`：机器人凭证。
- `channels.msteams.webhook.port`（默认 `3978`）
- `channels.msteams.webhook.path`（默认 `/api/messages`）
- `channels.msteams.dmPolicy`：`pairing | allowlist | open | disabled`（默认：pairing）
- `channels.msteams.allowFrom`：私信允许列表（推荐使用 AAD 对象 ID）。当 Graph 访问可用时，向导会在设置期间将名称解析为 ID。
- `channels.msteams.dangerouslyAllowNameMatching`：紧急开关，用于重新启用可变的 UPN/显示名称匹配和直接团队/渠道名称路由。
- `channels.msteams.textChunkLimit`：出站文本分块大小。
- `channels.msteams.chunkMode`：`length`（默认）或 `newline`，可先按空行（段落边界）拆分，再按长度分块。
- `channels.msteams.mediaAllowHosts`：传入附件主机允许列表（默认为 Microsoft/Teams 域名）。
- `channels.msteams.mediaAuthAllowHosts`：媒体重试时附加 Authorization 头的主机允许列表（默认为 Graph + Bot Framework 主机）。
- `channels.msteams.requireMention`：在渠道/群组中要求 @mention（默认 true）。
- `channels.msteams.replyStyle`：`thread | top-level`（参见[回复样式](#reply-style-threads-vs-posts)）。
- `channels.msteams.teams.<teamId>.replyStyle`：按团队覆盖。
- `channels.msteams.teams.<teamId>.requireMention`：按团队覆盖。
- `channels.msteams.teams.<teamId>.tools`：按团队的默认工具策略覆盖（`allow`/`deny`/`alsoAllow`），当缺少渠道覆盖时使用。
- `channels.msteams.teams.<teamId>.toolsBySender`：按团队、按发送者的默认工具策略覆盖（支持 `"*"` 通配符）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`：按渠道覆盖。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`：按渠道覆盖。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`：按渠道的工具策略覆盖（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`：按渠道、按发送者的工具策略覆盖（支持 `"*"` 通配符）。
- `toolsBySender` 键应使用显式前缀：
  `id:`、`e164:`、`username:`、`name:`（旧版无前缀键仍仅映射到 `id:`）。
- `channels.msteams.actions.memberInfo`：启用或禁用基于 Graph 的成员信息操作（默认：当 Graph 凭证可用时启用）。
- `channels.msteams.authType`：身份验证类型——`"secret"`（默认）或 `"federated"`。
- `channels.msteams.certificatePath`：PEM 证书文件路径（联合身份验证 + 证书身份验证）。
- `channels.msteams.certificateThumbprint`：证书指纹（可选，身份验证不要求）。
- `channels.msteams.useManagedIdentity`：启用托管身份验证（联合模式）。
- `channels.msteams.managedIdentityClientId`：用户分配托管身份的客户端 ID。
- `channels.msteams.sharePointSiteId`：用于群聊/渠道中文件上传的 SharePoint 站点 ID（参见[在群聊中发送文件](#sending-files-in-group-chats)）。

## 路由与会话

- 会话键遵循标准智能体格式（参见 [/concepts/session](/zh-CN/concepts/session)）：
  - 私信共享主会话（`agent:<agentId>:<mainKey>`）。
  - 渠道/群组消息使用会话 ID：
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 回复样式：线程与帖子

Teams 最近在同一底层数据模型上引入了两种渠道 UI 样式：

| 样式 | 描述 | 推荐 `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts**（经典） | 消息显示为卡片，下方带有线程回复 | `thread`（默认） |
| **Threads**（类似 Slack） | 消息线性流动，更像 Slack | `top-level` |

**问题：** Teams API 不会暴露某个渠道使用的是哪种 UI 样式。如果你使用了错误的 `replyStyle`：

- 在 Threads 样式的渠道中使用 `thread` → 回复会以不自然的嵌套方式显示
- 在 Posts 样式的渠道中使用 `top-level` → 回复会显示为独立的顶层帖子，而不是在线程中

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

- **私信：** 图片和文件附件可通过 Teams 机器人文件 API 工作。
- **渠道/群组：** 附件存储在 M365 存储中（SharePoint/OneDrive）。webhook payload 只包含 HTML 占位内容，不包含实际文件字节。**下载渠道附件需要 Graph API 权限**。
- 对于显式的文件优先发送，使用 `action=upload-file`，并搭配 `media` / `filePath` / `path`；可选的 `message` 会作为附带文本/评论，`filename` 会覆盖上传名称。

如果没有 Graph 权限，带图片的渠道消息将作为纯文本接收（机器人无法访问图片内容）。
默认情况下，OpenClaw 仅从 Microsoft/Teams 主机名下载媒体。可通过 `channels.msteams.mediaAllowHosts` 覆盖（使用 `["*"]` 可允许任意主机）。
Authorization 头只会附加到 `channels.msteams.mediaAuthAllowHosts` 中的主机（默认为 Graph + Bot Framework 主机）。请保持此列表严格（避免多租户后缀）。

## 在群聊中发送文件

机器人可以通过 FileConsentCard 流程在私信中发送文件（内置支持）。但是，**在群聊/渠道中发送文件**需要额外设置：

| 上下文 | 文件发送方式 | 所需设置 |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **私信** | FileConsentCard → 用户接受 → 机器人上传 | 开箱即用 |
| **群聊/渠道** | 上传到 SharePoint → 分享链接 | 需要 `sharePointSiteId` + Graph 权限 |
| **图片（任意上下文）** | Base64 编码内联 | 开箱即用 |

### 为什么群聊需要 SharePoint

机器人没有个人 OneDrive drive（`/me/drive` Graph API 端点不适用于应用程序身份）。要在群聊/渠道中发送文件，机器人会上传到一个 **SharePoint 站点** 并创建共享链接。

### 设置

1. 在 Entra ID（Azure AD）→ App Registration 中**添加 Graph API 权限**：
   - `Sites.ReadWrite.All`（Application）- 上传文件到 SharePoint
   - `Chat.Read.All`（Application）- 可选，启用按用户共享链接

2. 为租户**授予管理员同意**。

3. **获取你的 SharePoint 站点 ID：**

   ```bash
   # 通过 Graph Explorer 或带有效令牌的 curl：
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # 示例：对于站点 "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # 响应包含："id": "contoso.sharepoint.com,guid1,guid2"
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
| `Sites.ReadWrite.All` 仅有此项 | 组织范围共享链接（组织内任何人都可访问） |
| `Sites.ReadWrite.All` + `Chat.Read.All` | 按用户共享链接（仅聊天成员可访问） |

按用户共享更安全，因为只有聊天参与者可以访问文件。如果缺少 `Chat.Read.All` 权限，机器人会回退为组织范围共享。

### 回退行为

| 场景 | 结果 |
| ------------------------------------------------- | -------------------------------------------------- |
| 群聊 + 文件 + 已配置 `sharePointSiteId` | 上传到 SharePoint，发送共享链接 |
| 群聊 + 文件 + 未配置 `sharePointSiteId` | 尝试上传到 OneDrive（可能失败），仅发送文本 |
| 个人聊天 + 文件 | FileConsentCard 流程（无需 SharePoint 也可工作） |
| 任意上下文 + 图片 | Base64 编码内联（无需 SharePoint 也可工作） |

### 文件存储位置

上传的文件存储在已配置 SharePoint 站点默认文档库中的 `/OpenClawShared/` 文件夹下。

## 投票（Adaptive Cards）

OpenClaw 将 Teams 投票作为 Adaptive Cards 发送（Teams 没有原生投票 API）。

- CLI：`openclaw message poll --channel msteams --target conversation:<id> ...`
- 投票结果由 Gateway 网关 记录在 `~/.openclaw/msteams-polls.json` 中。
- Gateway 网关 必须保持在线才能记录投票。
- 投票尚不会自动发布结果摘要（如有需要，请检查存储文件）。

## 展示卡片

使用 `message` 工具或 CLI，将语义化展示 payload 发送给 Teams 用户或会话。OpenClaw 会根据通用展示契约将其渲染为 Teams Adaptive Cards。

`presentation` 参数接受语义块。当提供 `presentation` 时，消息文本为可选项。

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

有关目标格式的详细信息，参见下方的[目标格式](#target-formats)。

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
# 按 ID 发送给用户
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# 按显示名称发送给用户（会触发 Graph API 查询）
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# 发送到群聊或渠道
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# 发送展示卡片到某个会话
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
如果没有 `user:` 前缀，名称默认会按群组或团队进行解析。按显示名称定位人员时，请始终使用 `user:`。
</Note>

## 主动消息

- 只有在用户交互**之后**才能发送主动消息，因为我们会在那时存储会话引用。
- 有关 `dmPolicy` 和允许列表控制，参见 `/gateway/configuration`。

## 团队和渠道 ID（常见陷阱）

Teams URL 中的 `groupId` 查询参数**不是**用于配置的团队 ID。请改为从 URL 路径中提取 ID：

**团队 URL：**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    团队 ID（对此进行 URL 解码）
```

**渠道 URL：**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      渠道 ID（对此进行 URL 解码）
```

**用于配置时：**

- 团队 ID = `/team/` 之后的路径片段（URL 解码后，例如 `19:Bk4j...@thread.tacv2`）
- 渠道 ID = `/channel/` 之后的路径片段（URL 解码后）
- **忽略** `groupId` 查询参数

## 私有渠道

机器人在私有渠道中的支持有限：

| 功能 | 标准渠道 | 私有渠道 |
| ---------------------------- | ----------------- | ---------------------- |
| 机器人安装 | 是 | 有限 |
| 实时消息（webhook） | 是 | 可能不可用 |
| RSC 权限 | 是 | 行为可能不同 |
| @mentions | 是 | 如果机器人可访问 |
| Graph API 历史记录 | 是 | 是（需要权限） |

**如果私有渠道不可用，可尝试以下变通方法：**

1. 使用标准渠道进行机器人交互
2. 使用私信——用户始终可以直接向机器人发送消息
3. 使用 Graph API 访问历史记录（需要 `ChannelMessage.Read.All`）

## 故障排除

### 常见问题

- **渠道中不显示图片：** 缺少 Graph 权限或管理员同意。重新安装 Teams 应用，并完全退出/重新打开 Teams。
- **渠道中没有响应：** 默认要求 mention；请设置 `channels.msteams.requireMention=false`，或按团队/渠道进行配置。
- **版本不匹配（Teams 仍显示旧 manifest）：** 删除后重新添加应用，并完全退出 Teams 以刷新。
- **webhook 返回 401 Unauthorized：** 手动测试时未携带 Azure JWT，出现这种情况是预期行为——说明端点可达，但身份验证失败。请使用 Azure Web Chat 进行正确测试。

### Manifest 上传错误

- **“Icon file cannot be empty”：** manifest 引用了 0 字节的图标文件。请创建有效的 PNG 图标（`outline.png` 为 32x32，`color.png` 为 192x192）。
- **“webApplicationInfo.Id already in use”：** 该应用仍安装在其他团队/聊天中。请先找到并卸载，或等待 5-10 分钟让更改传播。
- **上传时出现 “Something went wrong”：** 请改为通过 [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) 上传，打开浏览器开发者工具（F12）→ Network 标签页，并检查响应体中的实际错误。
- **旁加载失败：** 尝试使用 “Upload an app to your org's app catalog” 而不是 “Upload a custom app”——这通常可以绕过旁加载限制。

### RSC 权限不生效

1. 确认 `webApplicationInfo.id` 与你的机器人 App ID 完全匹配
2. 重新上传应用，并在团队/聊天中重新安装
3. 检查你的组织管理员是否阻止了 RSC 权限
4. 确认你使用了正确的作用域：团队用 `ChannelMessage.Read.Group`，群聊用 `ChatMessage.Read.Chat`

## 参考

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot 设置指南
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - 创建/管理 Teams 应用
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4)（渠道/群组需要 Graph）
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - 用于机器人管理的 Teams CLI

## 相关内容

- [Channels Overview](/zh-CN/channels) — 所有受支持的渠道
- [Pairing](/zh-CN/channels/pairing) — 私信身份验证与配对流程
- [Groups](/zh-CN/channels/groups) — 群聊行为与提及控制
- [Channel Routing](/zh-CN/channels/channel-routing) — 消息的会话路由
- [Security](/zh-CN/gateway/security) — 访问模型与加固措施
