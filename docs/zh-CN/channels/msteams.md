---
read_when:
    - 处理 Microsoft Teams 渠道功能
summary: Microsoft Teams 机器人支持状态、能力和配置
title: Microsoft Teams
x-i18n:
    generated_at: "2026-07-05T11:03:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 00ce5e18ce45700233e62fff3d9dc8f013a0eacd103d9ca6f2c6256643121ca7
    source_path: channels/msteams.md
    workflow: 16
---

状态：支持文本 + 私信附件；渠道/群组文件发送需要 `sharePointSiteId` + Graph 权限（参见[在群聊中发送文件](#sending-files-in-group-chats)）。投票通过 Adaptive Cards 发送。消息操作会暴露显式的 `upload-file`，用于文件优先发送。

## 内置插件

Microsoft Teams 在当前 OpenClaw 版本中作为内置插件提供；普通打包构建不需要单独安装。

在较旧构建或排除内置 Teams 的自定义安装中，直接安装 npm 包：

```bash
openclaw plugins install @openclaw/msteams
```

使用裸包以跟随当前官方发布标签。只有在需要可复现安装时，才固定精确版本。

本地检出（从 git 仓库运行）：

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

详情：[插件](/zh-CN/tools/plugin)

## 快速设置

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) 用一条命令处理 Bot 注册、清单创建和凭据生成。

**1. 安装并登录**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI 当前处于预览阶段。命令和标志可能会在不同版本之间变化。
</Note>

**2. 启动隧道**（Teams 无法访问 localhost）

如有需要，安装并认证 devtunnel CLI（[入门指南](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)）。

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` 是必需的，因为 Teams 无法通过 devtunnels 进行认证。每个传入的 Bot 请求仍会由 Teams SDK 验证。
</Note>

替代方案：`ngrok http 3978` 或 `tailscale funnel 3978`（URL 每个会话可能会变化）。

**3. 创建应用**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

这会创建一个 Entra ID（Azure AD）应用，生成客户端密钥，构建并上传 Teams 应用清单（包含图标），并注册由 Teams 管理的 Bot（不需要 Azure 订阅）。输出包含 `CLIENT_ID`、`CLIENT_SECRET`、`TENANT_ID` 和一个 **Teams App ID**；它还会提示你直接在 Teams 中安装应用。

**4. 使用输出中的凭据配置 OpenClaw**：

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

或直接使用环境变量：`MSTEAMS_APP_ID`、`MSTEAMS_APP_PASSWORD`、`MSTEAMS_TENANT_ID`。

**5. 在 Teams 中安装应用**

`teams app create` 会提示你安装应用；选择 “Install in Teams”。之后如需获取安装链接：

```bash
teams app get <teamsAppId> --install-link
```

**6. 验证一切正常**

```bash
teams app doctor <teamsAppId>
```

跨 Bot 注册、AAD 应用配置、清单有效性和 SSO 设置运行诊断。

对于生产环境，请考虑使用[联合认证](#federated-authentication-certificate-plus-managed-identity)（证书或托管身份）代替客户端密钥。

<Note>
默认情况下会阻止群聊（`channels.msteams.groupPolicy: "allowlist"`）。若要允许群组回复，请设置 `channels.msteams.groupAllowFrom`，或使用 `groupPolicy: "open"` 允许任何成员（受提及门控）。
</Note>

## 目标

- 通过 Teams 私信、群聊或渠道与 OpenClaw 交互。
- 保持路由确定性：回复始终返回到其来源渠道。
- 默认使用安全的渠道行为（除非另有配置，否则需要提及）。

## 配置写入

默认情况下，Microsoft Teams 可以写入由 `/config set|unset` 触发的配置更新（需要 `commands.config: true`）。

使用以下配置禁用：

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## 访问控制（私信 + 群组）

**私信访问**

- 默认值：`channels.msteams.dmPolicy = "pairing"`。未知发送者会被忽略，直到被批准。
- `channels.msteams.allowFrom` 应使用稳定的 AAD 对象 ID，或使用静态发送者访问组，例如 `accessGroup:core-team`。
- 不要依赖 UPN/显示名称匹配来做允许列表；它们可能会变化。OpenClaw 默认禁用直接名称匹配；使用 `channels.msteams.dangerouslyAllowNameMatching: true` 选择启用。
- 当凭据允许时，向导可以通过 Microsoft Graph 将名称解析为 ID。

**群组访问**

- 默认值：`channels.msteams.groupPolicy = "allowlist"`（除非添加 `groupAllowFrom`，否则阻止）。当 `channels.msteams.groupPolicy` 未设置时，`channels.defaults.groupPolicy` 可以覆盖共享默认值。
- `channels.msteams.groupAllowFrom` 控制哪些发送者或静态发送者访问组可以在群聊/渠道中触发（回退到 `channels.msteams.allowFrom`）。
- 设置 `groupPolicy: "open"` 以允许任何成员（默认仍受提及门控）。
- 若要阻止**所有**渠道，请设置 `channels.msteams.groupPolicy: "disabled"`。

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

**团队 + 渠道允许列表**

- 通过在 `channels.msteams.teams` 下列出团队和渠道，限定群组/渠道回复范围。
- 使用 Teams 链接中的稳定 Teams 对话 ID 作为键，不要使用可变的显示名称（参见[团队和渠道 ID](#team-and-channel-ids-common-gotcha)）。
- 当 `groupPolicy="allowlist"` 且存在 teams 允许列表时，只接受列出的团队/渠道（受提及门控）。
- 配置向导接受 `Team/Channel` 条目并为你保存。
- 启动时，OpenClaw 会将团队/渠道和用户允许列表名称解析为 ID（当 Graph 权限允许时），并记录映射。未解析的名称会按输入保留，但会在路由时被忽略，除非设置了 `channels.msteams.dangerouslyAllowNameMatching: true`。

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

### 工作原理

1. 确保 Microsoft Teams 插件可用（当前版本已内置）。
2. 创建一个 **Azure Bot**（App ID + 密钥 + 租户 ID）。
3. 构建一个引用该 Bot 的 **Teams 应用包**，包含下面的 RSC 权限。
4. 将 Teams 应用上传/安装到一个团队（或用于私信的个人范围）。
5. 在 `~/.openclaw/openclaw.json`（或环境变量）中配置 `msteams`，并启动 Gateway 网关。
6. Gateway 网关默认在 `/api/messages` 上监听 Bot Framework webhook 流量。

### 第 1 步：创建 Azure Bot

1. 前往[创建 Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. 填写 **Basics** 标签页：

   | 字段               | 值                                                     |
   | ------------------ | ------------------------------------------------------ |
   | **Bot handle**     | 你的 Bot 名称，例如 `openclaw-msteams`（必须唯一）     |
   | **Subscription**   | 选择你的 Azure 订阅                                   |
   | **Resource group** | 新建或使用现有资源组                                  |
   | **Pricing tier**   | 开发/测试使用 **Free**                                |
   | **Type of App**    | **Single Tenant**（推荐；见下方说明）                 |
   | **Creation type**  | **Create new Microsoft App ID**                       |

<Warning>
新建多租户 Bot 已在 2025-07-31 之后弃用。新 Bot 请使用 **Single Tenant**。
</Warning>

3. 点击 **Review + create**，然后点击 **Create**（约 1-2 分钟）。

### 第 2 步：获取凭据

1. Azure Bot 资源 → **Configuration** → 复制 **Microsoft App ID**（你的 `appId`）。
2. **Manage Password** → App Registration → **Certificates & secrets** → **New client secret** → 复制 **Value**（你的 `appPassword`）。
3. **Overview** → 复制 **Directory (tenant) ID**（你的 `tenantId`）。

### 第 3 步：配置消息端点

1. Azure Bot → **Configuration**。
2. 设置 **Messaging endpoint**：
   - 生产环境：`https://your-domain.com/api/messages`
   - 本地开发：使用隧道（参见[本地开发](#local-development-tunneling)）

### 第 4 步：启用 Teams 渠道

1. Azure Bot → **Channels**。
2. 点击 **Microsoft Teams** → Configure → Save。
3. 接受服务条款。

### 第 5 步：构建 Teams 应用清单

- 包含一个 `bot` 条目，其中 `botId = <App ID>`。
- 范围：`personal`、`team`、`groupChat`。
- `supportsFiles: true`（个人范围文件处理必需）。
- 添加 RSC 权限（参见 [RSC 权限](#current-teams-rsc-permissions-manifest)）。
- 创建图标：`outline.png`（32x32）和 `color.png`（192x192）。
- 将 `manifest.json`、`outline.png` 和 `color.png` 一起压缩成 zip。

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

当插件可用且 `msteams` 配置包含凭据时，Teams 渠道会自动启动。

</details>

## 联合认证（证书加托管身份）

对于生产环境，OpenClaw 支持通过 `channels.msteams.authType: "federated"` 使用**联合认证**作为客户端密钥的替代方案。两种方法：

### 选项 A：基于证书的认证

使用在你的 Entra ID 应用注册中注册的 PEM 证书。

**设置：**

1. 生成或获取证书（包含私钥的 PEM 格式）。
2. Entra ID → App Registration → **Certificates & secrets** → **Certificates** → 上传公钥证书。

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

在 Azure 基础设施（AKS、App Service、Azure VM）上使用 Azure 托管身份进行无密码认证。

**工作原理：**

1. Bot pod/VM 具有一个托管身份（系统分配或用户分配）。
2. 联合身份凭据将托管身份链接到 Entra ID 应用注册。
3. 运行时，OpenClaw 使用 `@azure/identity` 从 Azure IMDS 端点获取令牌。
4. 令牌会传递给 Teams SDK 用于 Bot 认证。

**前提条件：**

- 启用了托管身份的 Azure 基础设施（AKS 工作负载身份、App Service、VM）。
- 在 Entra ID 应用注册上创建的联合身份凭据。
- pod/VM 可以通过网络访问 IMDS（`169.254.169.254:80`）。

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

**配置（用户分配托管身份）：**在上面的块中添加 `managedIdentityClientId: "<MI_CLIENT_ID>"`。

**环境变量：**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>`（仅用户分配）

### AKS 工作负载身份设置

对于使用 workload identity 的 AKS 部署：

1. 在你的 AKS 集群上**启用 workload identity**。
2. 在 Entra ID 应用注册上**创建联合身份凭据**：

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. 使用应用客户端 ID **标注 Kubernetes 服务账号**：

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. 为 workload identity 注入**标记 Pod**：

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **允许网络访问** IMDS（`169.254.169.254`）：如果使用 NetworkPolicy，请为端口 80 上的 `169.254.169.254/32` 添加一条出站规则。

### 凭证类型对比

| 方法                 | 配置                                           | 优点                         | 缺点                         |
| -------------------- | ---------------------------------------------- | ---------------------------- | ---------------------------- |
| **客户端密钥**       | `appPassword`                                  | 设置简单                     | 需要轮换密钥，安全性较低     |
| **证书**             | `authType: "federated"` + `certificatePath`    | 不通过网络共享密钥           | 证书管理有额外开销           |
| **托管身份**         | `authType: "federated"` + `useManagedIdentity` | 无密码，无需管理密钥         | 需要 Azure 基础设施          |

`certificateThumbprint` 可以与 `certificatePath` 一起设置，但当前凭证路径不会读取它；它仅为前向兼容而接受。

**默认值：**当未设置 `authType` 时，OpenClaw 使用客户端密钥凭证（`appPassword`）。现有配置会保持不变并继续工作。

## 本地开发（隧道）

Teams 无法访问 `localhost`。请使用持久开发隧道，让 URL 在不同会话之间保持稳定：

```bash
# 一次性设置：
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# 每个开发会话：
devtunnel host my-openclaw-bot
```

替代方案：`ngrok http 3978` 或 `tailscale funnel 3978`（URL 可能会在每个会话中变化）。

如果隧道 URL 发生变化，请更新端点：

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

1. 安装 Teams 应用（安装链接来自 `teams app get <id> --install-link`）。
2. 在 Teams 中找到 Bot 并发送一条私信。
3. 检查 Gateway 网关日志中的传入活动。

## 环境变量

这些凭证相关配置键可以通过环境变量设置，而不是写入 `openclaw.json`（其他配置键，例如 `groupPolicy` 或 `historyLimit`，只能通过配置设置）：

| 环境变量                             | 配置键                    | 说明                                |
| ------------------------------------ | ------------------------- | ----------------------------------- |
| `MSTEAMS_APP_ID`                     | `appId`                   |                                     |
| `MSTEAMS_APP_PASSWORD`               | `appPassword`             |                                     |
| `MSTEAMS_TENANT_ID`                  | `tenantId`                |                                     |
| `MSTEAMS_AUTH_TYPE`                  | `authType`                | `"secret"` 或 `"federated"`         |
| `MSTEAMS_CERTIFICATE_PATH`           | `certificatePath`         | 联合身份 + 证书                     |
| `MSTEAMS_CERTIFICATE_THUMBPRINT`     | `certificateThumbprint`   | 已接受，但凭证不需要               |
| `MSTEAMS_USE_MANAGED_IDENTITY`       | `useManagedIdentity`      | 联合身份 + 托管身份                 |
| `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` | `managedIdentityClientId` | 仅限用户分配的托管身份             |

## 成员信息操作

OpenClaw 为 Microsoft Teams 暴露了一个由 Graph 支持的 `member-info` 消息操作，使智能体和自动化可以直接从 Microsoft Graph 解析频道成员详情（显示名称、电子邮件、职位、UPN、办公室位置）。

要求：

- `Member.Read.Group` RSC 权限（已包含在推荐清单中）。
- 对于跨团队查找：需要带管理员同意的 `User.Read.All` Graph Application 权限。

只要配置了 Graph 凭证，该操作就会运行；未配置时会因 Graph 凭证错误而失败。没有单独的 `channels.msteams.actions.memberInfo` 开关。

## 历史上下文

- `channels.msteams.historyLimit` 控制有多少最近的频道/群组消息会被包装进提示词。回退到 `messages.groupChat.historyLimit`，然后默认值为 50。设置为 `0` 可禁用。
- 获取的线程历史会按发送者允许列表（`allowFrom` / `groupAllowFrom`）过滤，因此线程上下文播种只包含来自允许发送者的消息。
- 引用附件上下文（从回复自身附件中的 Skype Reply-schema HTML 解析）会不经过过滤直接传递；目前只有线程历史播种会应用发送者允许列表过滤。
- 私信历史可以通过 `channels.msteams.dmHistoryLimit`（用户轮次）限制。按用户覆盖：`channels.msteams.dms["<user_id>"].historyLimit`。

## 当前 Teams RSC 权限（清单）

这些是我们的 Teams 应用清单中**现有的 resourceSpecific 权限**。它们只在安装了该应用的团队/聊天内生效。

**用于频道（团队范围）：**

- `ChannelMessage.Read.Group` (Application) - 在没有 @提及的情况下接收所有频道消息
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**用于群聊：**

- `ChatMessage.Read.Chat` (Application) - 在没有 @提及的情况下接收所有群聊消息

通过 Teams CLI 添加 RSC 权限：

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

- `bots[].botId` **必须**与 Azure Bot App ID 匹配。
- `webApplicationInfo.id` **必须**与 Azure Bot App ID 匹配。
- `bots[].scopes` 必须包含你计划使用的界面（`personal`、`team`、`groupChat`）。
- `bots[].supportsFiles: true` 是个人范围内处理文件所必需的。
- `authorization.permissions.resourceSpecific` 必须包含频道流量的频道读取/发送权限。

### 更新现有应用

```bash
# 下载、编辑并重新上传清单
teams app manifest download <teamsAppId> manifest.json
# 在本地编辑 manifest.json...
teams app manifest upload manifest.json <teamsAppId>
# 如果内容发生变化，版本会自动递增
```

更新后，在每个团队中重新安装该应用，并**完全退出并重新启动 Teams**（不要只是关闭窗口），以清除缓存的应用元数据。

<details>
<summary>手动更新清单（不使用 CLI）</summary>

1. 使用新设置更新 `manifest.json`。
2. **递增 `version` 字段**（例如 `1.0.0` → `1.1.0`）。
3. 使用图标**重新压缩**清单（`manifest.json`、`outline.png`、`color.png`）。
4. 上传新的 zip：
   - **Teams 管理中心：**Teams 应用 → 管理应用 → 找到你的应用 → 上传新版本。
   - **旁加载：**Teams → 应用 → 管理你的应用 → 上传自定义应用。

</details>

## 能力：仅 RSC 与 Graph 对比

### 仅使用 **Teams RSC**（已安装应用，无 Graph API 权限）

可用：

- 读取频道消息**文本**内容。
- 发送频道消息**文本**内容。
- 接收**个人（私信）**文件附件。

不可用：

- 频道/群组**图片或文件内容**（载荷只包含 HTML 存根）。
- 下载存储在 SharePoint/OneDrive 中的附件。
- 读取实时 webhook 事件之外的消息历史。

### 使用 **Teams RSC + Microsoft Graph Application 权限**

新增：

- 下载托管内容（粘贴到消息中的图片）。
- 下载存储在 SharePoint/OneDrive 中的文件附件。
- 通过 Graph 读取频道/聊天消息历史。

### RSC 与 Graph API

| 能力                   | RSC 权限             | Graph API                           |
| ---------------------- | -------------------- | ----------------------------------- |
| **实时消息**           | 是（通过 webhook）   | 否（仅轮询）                        |
| **历史消息**           | 否                   | 是（可以查询历史）                  |
| **设置复杂度**         | 仅应用清单           | 需要管理员同意 + 令牌流程           |
| **离线可用**           | 否（必须正在运行）   | 是（可随时查询）                    |

**结论：**RSC 用于实时监听；Graph API 用于历史访问。若要在离线后补上错过的消息，你需要带 `ChannelMessage.Read.All` 的 Graph API（需要管理员同意）。

## 启用 Graph 的媒体 + 历史（频道必需）

对于**频道**中的图片/文件，或要获取**消息历史**，请启用 Microsoft Graph 权限并授予管理员同意：

1. Entra ID (Azure AD) **应用注册** → 添加 Graph **Application 权限**：
   - `ChannelMessage.Read.All`（频道附件 + 历史）
   - `Chat.Read.All` 或 `ChatMessage.Read.All`（群聊）
2. 为租户**授予管理员同意**。
3. 提升 Teams 应用**清单版本**，重新上传，并**在 Teams 中重新安装应用**。
4. **完全退出并重新启动 Teams**，以清除缓存的应用元数据。

**用户提及：**对于已在当前对话中的用户，@提及开箱即用。若要动态搜索并提及**不在当前对话中**的用户，请添加 `User.Read.All` (Application) 权限并授予管理员同意。

## 已知限制

### Webhook 超时

Teams 通过 HTTP webhook 传递消息。OpenClaw 会对该 webhook 监听器应用固定的 HTTP 服务器超时：30 秒无活动、30 秒总请求时间、15 秒接收标头时间。如果智能体处理时间超过客户端自身的重试窗口，你可能会看到：

- Teams 重试消息（导致重复）。
- 回复丢失。

OpenClaw 会快速确认 webhook（在智能体处理完成之前），并在智能体响应后主动发送回复，但非常慢的智能体运行仍可能在 Teams 侧触发重试/重复。

### Teams 云和服务 URL 支持

这条由 SDK 支持的 Teams 路径已针对 Microsoft Teams 公共云完成实际验证。

入站回复使用传入的 Teams SDK 轮次上下文。上下文外的主动操作 —— 发送、编辑、删除、卡片、投票、文件同意消息，以及排队的长时间运行回复 —— 使用已存储会话引用中的 `serviceUrl`。公共云默认使用 Teams SDK 公共云环境，并允许公共 Teams Connector 主机上的已存储引用：`https://smba.trafficmanager.net/`。

公共云是默认设置。对于普通公共云 bot，你不需要设置 `channels.msteams.cloud` 或 `channels.msteams.serviceUrl`。

对于非公共 Teams 云，在 Microsoft 发布对应主动边界时，设置 `cloud` 和匹配的主动边界：

- `channels.msteams.cloud` 选择 Teams SDK 云预设，用于身份验证、JWT 验证、令牌服务和 Graph 权限范围。
- `channels.msteams.serviceUrl` 选择 Bot Connector 端点边界，用于在主动发送、编辑、删除、卡片、投票、文件同意消息和排队的长时间运行回复之前验证已存储的会话引用。USGov 和 DoD SDK 云需要此项。对于 China/21Vianet，OpenClaw 使用 SDK `China` 预设，并且只接受 Azure China Bot Framework 渠道主机上的已存储/已配置服务 URL。

Microsoft 在 Teams 主动消息文档的 [创建会话](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation)部分发布了全局主动 Bot Connector 端点。可用时使用传入活动的 `serviceUrl`；否则使用下面的 Microsoft 表格。

| Teams 环境 | OpenClaw 配置                                             | 主动 `serviceUrl`                             |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| 公共云            | 不需要 cloud/serviceUrl 配置                           | `https://smba.trafficmanager.net/teams`            |
| GCC               | 设置 `serviceUrl`；不存在单独的 Teams SDK 云预设 | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High          | `cloud: "USGov"` + `serviceUrl`                             | `https://smba.infra.gov.teams.microsoft.us/teams`  |
| DoD               | `cloud: "USGovDoD"` + `serviceUrl`                          | `https://smba.infra.dod.teams.microsoft.us/teams`  |
| China/21Vianet    | `cloud: "China"`                                            | 使用传入活动的 `serviceUrl`           |

GCC 示例：Microsoft 记录了单独的主动服务 URL，但 Teams SDK 未暴露单独的 GCC 云预设：

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

`channels.msteams.serviceUrl` 仅限受支持的 Microsoft Teams Bot Connector 主机。配置服务 URL 后，OpenClaw 会在主动发送、编辑、删除、卡片、投票或排队的长时间运行回复执行前，检查已存储会话的 `serviceUrl` 是否使用同一主机。使用默认公共云配置时，如果已存储会话指向公共 Teams Connector 主机之外，OpenClaw 会失败关闭。更改云/服务 URL 设置后，请从该会话接收一条新消息，以便已存储会话引用保持最新。

China/21Vianet 在 Microsoft 的 Teams 主动端点表中没有单独的全局主动 `smba` URL。配置 `cloud: "China"`，让 Teams SDK 使用 Azure China 身份验证、令牌和 JWT 端点。随后，主动发送需要来自传入 China Teams 活动的已存储会话引用，或 Azure China Bot Framework 渠道边界（`*.botframework.azure.cn`）上的显式配置服务 URL。对于 `cloud: "China"`，由 Graph 支持的 Teams 辅助功能会被禁用，直到 OpenClaw 将 Graph 请求路由到 Azure China Graph 端点。

### 格式化

Teams markdown 比 Slack 或 Discord 更受限：

- 基本格式可用：**粗体**、_斜体_、`code`、链接。
- 复杂 markdown（表格、嵌套列表）可能无法正确渲染。
- Adaptive Cards 支持投票和语义呈现发送（见下文）。

## 配置

关键设置（共享渠道模式见 [/gateway/configuration](/zh-CN/gateway/configuration)）：

- `channels.msteams.enabled`：启用/禁用该渠道。
- `channels.msteams.appId`、`channels.msteams.appPassword`、`channels.msteams.tenantId`：bot 凭据。
- `channels.msteams.cloud`：Teams SDK 云环境（`Public`、`USGov`、`USGovDoD` 或 `China`；默认 `Public`）。对于 USGov/DoD SDK 云，与 `serviceUrl` 一起设置；China 使用 SDK 预设和已存储的 Azure China Bot Framework 会话引用，并且由 Graph 支持的辅助功能会被禁用，直到 Azure China Graph 路由发布。
- `channels.msteams.serviceUrl`：SDK 主动操作的 Bot Connector 服务 URL 边界。公共云使用 SDK 默认值；GCC（`https://smba.infra.gcc.teams.microsoft.com/teams`）、GCC High 或 DoD 需要设置。China 在已存储会话引用来自由 21Vianet 运营的 Teams 时，接受 Azure China Bot Framework 渠道主机。
- `channels.msteams.webhook.port`（默认 `3978`）。
- `channels.msteams.webhook.path`（默认 `/api/messages`）。
- `channels.msteams.dmPolicy`：`pairing | allowlist | open | disabled`（默认 `pairing`）。
- `channels.msteams.allowFrom`：私信允许列表（推荐 AAD 对象 ID）。Graph 访问可用时，向导会在设置期间将名称解析为 ID。
- `channels.msteams.dangerouslyAllowNameMatching`：紧急开关，用于重新启用可变 UPN/显示名称匹配和直接团队/渠道名称路由。
- `channels.msteams.textChunkLimit`：出站文本分块大小，单位为字符（默认 `4000`，且无论配置了更高值，都会硬性上限为 `4000`）。
- `channels.msteams.chunkMode`：`length`（默认）或 `newline`，用于在按长度分块前按空行（段落边界）拆分。
- `channels.msteams.mediaAllowHosts`：入站附件主机允许列表（默认 Microsoft/Teams 域：Graph、SharePoint/OneDrive、Teams CDN、Bot Framework、Azure Media Services）。
- `channels.msteams.mediaAuthAllowHosts`：媒体重试时允许附加 Authorization 标头的主机允许列表（默认 Graph + Bot Framework 主机）。
- `channels.msteams.mediaMaxMb`：每渠道媒体大小限制覆盖值，单位 MB。未设置时回退到 `agents.defaults.mediaMaxMb`。
- `channels.msteams.requireMention`：在渠道/群组中要求 @mention（默认 `true`）。
- `channels.msteams.replyStyle`：`thread | top-level`（见[回复样式](#reply-style-threads-vs-posts)）。
- `channels.msteams.teams.<teamId>.replyStyle`：按团队覆盖。
- `channels.msteams.teams.<teamId>.requireMention`：按团队覆盖。
- `channels.msteams.teams.<teamId>.tools`：按团队的默认工具策略覆盖（`allow`/`deny`/`alsoAllow`），在缺少渠道覆盖时使用。
- `channels.msteams.teams.<teamId>.toolsBySender`：按团队、按发送者的默认工具策略覆盖（支持 `"*"` 通配符）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`：按渠道覆盖。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`：按渠道覆盖。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`：按渠道的工具策略覆盖（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`：按渠道、按发送者的工具策略覆盖（支持 `"*"` 通配符）。
- `toolsBySender` 键应使用显式前缀：`channel:`、`id:`、`e164:`、`username:`、`name:`（旧版无前缀键仍仅映射到 `id:`）。
- `channels.msteams.authType`：身份验证类型 - `"secret"`（默认）或 `"federated"`。
- `channels.msteams.certificatePath`：PEM 证书文件路径（联合 + 证书身份验证）。
- `channels.msteams.certificateThumbprint`：证书指纹；可接受，但身份验证不要求。
- `channels.msteams.useManagedIdentity`：启用托管标识身份验证（联合模式）。
- `channels.msteams.managedIdentityClientId`：用户分配托管标识的客户端 ID。
- `channels.msteams.sharePointSiteId`：群聊/渠道中文件上传所用的 SharePoint 站点 ID（见[在群聊中发送文件](#sending-files-in-group-chats)）。
- `channels.msteams.welcomeCard`、`channels.msteams.groupWelcomeCard`、`channels.msteams.promptStarters`：首次私信/群组联系时显示的欢迎 Adaptive Card，以及其建议提示按钮。
- `channels.msteams.responsePrefix`：添加到出站回复前的文本。
- `channels.msteams.feedbackEnabled`（默认 `true`）、`channels.msteams.feedbackReflection`（默认 `true`）、`channels.msteams.feedbackReflectionCooldownMs`：回复上的点赞/点踩反馈，以及负面反馈反思跟进。
- `channels.msteams.sso`、`channels.msteams.delegatedAuth`：用于 SSO 支持流程的 Bot Framework OAuth 连接和委托 Graph 权限范围；`sso.enabled: true` 要求 `sso.connectionName`。

## 路由和会话

- 会话键遵循标准智能体格式（见 [/concepts/session](/zh-CN/concepts/session)）：
  - 直接消息共享主会话（`agent:<agentId>:<mainKey>`）。
  - 渠道/群组消息使用会话 id：
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 回复样式：线程与帖子

Teams 在同一底层数据模型上有两种渠道 UI 样式：

| 样式                    | 描述                                               | 推荐 `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **帖子**（经典）      | 消息显示为卡片，下方带有线程回复 | `thread`（默认）       |
| **线程**（类似 Slack） | 消息按线性流动，更像 Slack                   | `top-level`              |

**问题：**Teams API 不会暴露渠道使用哪种 UI 样式。如果你使用了错误的 `replyStyle`：

- 线程样式渠道中的 `thread` → 回复会以别扭的嵌套形式出现。
- 帖子样式渠道中的 `top-level` → 回复会显示为单独的顶层帖子，而不是在线程内。

**解决方案：**根据渠道的设置方式，按渠道配置 `replyStyle`：

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

当 bot 向渠道发送回复时，`replyStyle` 会从最具体的覆盖项向下解析到默认值。第一个非 `undefined` 值生效：

1. **按渠道** - `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **按团队** - `channels.msteams.teams.<teamId>.replyStyle`
3. **全局** - `channels.msteams.replyStyle`
4. **隐式默认值** - 派生自 `requireMention`：
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

如果你在全局设置 `requireMention: false`，但没有显式设置 `replyStyle`，Posts 风格渠道中的提及会显示为顶层帖子，即使入站消息是线程回复。请在全局、团队或渠道级别固定 `replyStyle: "thread"`，以避免意外。

对于发送到已存储渠道对话的主动发送（排队的工具调用回复、长时间运行的智能体），同样适用团队/渠道解析；对于主动发送，无论 `replyStyle` 如何设置，群聊和个人（私信）对话始终解析为 `top-level`。

### 线程上下文保留

当 `replyStyle: "thread"` 生效，并且 bot 是在渠道线程内被 @提及的，OpenClaw 会将原始线程根重新附加到出站对话引用（`19:...@thread.tacv2;messageid=<root>`），使回复落在同一线程内。这同时适用于实时（轮次内）发送，以及在 Bot Framework 轮次上下文过期后发出的主动发送（例如长时间运行的智能体、通过 `mcp__openclaw__message` 排队的工具调用回复）。

线程根取自对话引用上存储的 `threadId`。早于 `threadId` 的旧存储引用会回退到 `activityId`（即最后一次为该对话播种的入站活动），因此现有部署无需重新播种即可继续工作。

当 `replyStyle: "top-level"` 生效时，渠道线程入站消息会被有意作为新的顶层帖子回复；不会附加线程后缀。这对 Threads 风格渠道是正确的；如果你期望线程回复却看到了顶层帖子，说明该渠道的 `replyStyle` 设置不正确。

## 附件和图像

**当前限制：**

- **私信：**图像和文件附件可通过 Teams bot 文件 API 工作。
- **渠道/群组：**附件位于 M365 存储（SharePoint/OneDrive）中。webhook 载荷只包含一个 HTML 占位片段，而不是实际文件字节。**需要 Graph API 权限**才能下载渠道附件。
- 对于显式的文件优先发送，请使用带有 `media` / `filePath` / `path` 的 `action=upload-file`；可选的 `message` 会成为随附文本/评论，`filename`（或 `title`）会覆盖上传名称。

如果没有 Graph 权限，带有图像的渠道消息会以纯文本形式到达（bot 无法访问图像内容）。
默认情况下，OpenClaw 只从 Microsoft/Teams 主机名下载媒体。可用 `channels.msteams.mediaAllowHosts` 覆盖（使用 `["*"]` 允许任意主机）。
Authorization 标头只会附加到 `channels.msteams.mediaAuthAllowHosts` 中的主机（默认为 Graph + Bot Framework 主机）。请保持此列表严格（避免多租户后缀）。

## 在群聊中发送文件

Bot 可以使用内置 FileConsentCard 流程在私信中发送文件。**在群聊/渠道中发送文件**需要额外设置：

| 上下文 | 文件发送方式 | 所需设置 |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **私信** | FileConsentCard → 用户接受 → bot 上传 | 开箱即用 |
| **群聊/渠道** | 上传到 SharePoint → 分享链接 | 需要 `sharePointSiteId` + Graph 权限 |
| **图像（任意上下文）** | Base64 编码内联 | 开箱即用 |

### 为什么群聊需要 SharePoint

Bot 没有个人 OneDrive 驱动器（`/me/drive` 对应用程序身份不起作用）。要在群聊/渠道中发送文件，bot 会上传到一个 **SharePoint 站点**并创建分享链接。

### 设置

1. 在 Entra ID (Azure AD) → App Registration 中**添加 Graph API 权限**：
   - `Sites.ReadWrite.All`（Application）- 将文件上传到 SharePoint。
   - `Chat.Read.All`（Application）- 可选，启用按用户分享链接。
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

### 分享行为

| 权限 | 分享行为 |
| --------------------------------------- | --------------------------------------------------------- |
| 仅 `Sites.ReadWrite.All` | 组织范围的分享链接（组织内任何人都可访问） |
| `Sites.ReadWrite.All` + `Chat.Read.All` | 按用户分享链接（只有聊天成员可访问） |

按用户分享更安全，因为只有聊天参与者可以访问该文件。如果缺少 `Chat.Read.All`，bot 会回退到组织范围的分享。

### 回退行为

| 场景 | 结果 |
| ------------------------------------------------- | -------------------------------------------------- |
| 群聊 + 文件 + 已配置 `sharePointSiteId` | 上传到 SharePoint，发送分享链接 |
| 群聊 + 文件 + 无 `sharePointSiteId` | 尝试 OneDrive 上传（可能失败），仅发送文本 |
| 个人聊天 + 文件 | FileConsentCard 流程（无需 SharePoint 即可工作） |
| 任意上下文 + 图像 | Base64 编码内联（无需 SharePoint 即可工作） |

### 文件存储位置

上传的文件存储在已配置 SharePoint 站点默认文档库的 `/OpenClawShared/` 文件夹中。

## 投票（Adaptive Cards）

OpenClaw 将 Teams 投票作为 Adaptive Cards 发送（没有原生 Teams 投票 API）。

- CLI：`openclaw message poll --channel msteams --target conversation:<id> --poll-question "..." --poll-option "..." --poll-option "..."`。
- 投票由 Gateway 网关记录在 `state/openclaw.sqlite` 下的 OpenClaw 插件状态 SQLite 中。
- 现有 `msteams-polls.json` 文件由 `openclaw doctor --fix` 导入，而不是由正在运行的插件导入。
- Gateway 网关必须保持在线才能记录投票。
- 投票不会自动发布结果摘要，目前也还没有投票结果 CLI。

## 呈现卡片

使用 `message` 工具、CLI 或普通回复投递，将语义化呈现载荷发送给 Teams 用户或对话。OpenClaw 会根据通用呈现契约将它们渲染为 Teams Adaptive Cards。

`presentation` 参数接受语义块。提供 `presentation` 时，消息文本是可选的。按钮会渲染为 Adaptive Card 提交或 URL 操作。选择菜单在 Teams 渲染器中不是原生能力，因此 OpenClaw 会在投递前将其降级为可读文本。

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

有关目标格式详情，请参阅下方的[目标格式](#target-formats)。

## 目标格式

MSTeams 目标使用前缀区分用户和对话：

| 目标类型 | 格式 | 示例 |
| ------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 用户（按 ID） | `user:<aad-object-id>` | `user:40a1a0ed-4ff2-4164-a219-55518990c197` |
| 用户（按名称） | `user:<display-name>` | `user:John Smith`（需要 Graph API） |
| 群组/渠道 | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2` |
| 群组/渠道（原始） | `<conversation-id>` | `19:abc123...@thread.tacv2`、`19:...@unq.gbl.spaces`，或裸 `a:`/`8:orgid:`/`29:` Bot Framework id |

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
如果没有 `user:` 前缀，名称默认会走群组或团队解析。按显示名称定位人员时，请始终使用 `user:`。
</Note>

## 主动消息

- 只有在用户已经交互**之后**，主动消息才可能发送，因为 OpenClaw 会在那时存储对话引用。
- 有关 `dmPolicy` 和 allowlist 门控，请参阅 [/gateway/configuration](/zh-CN/gateway/configuration)。

## 团队和渠道 ID（常见陷阱）

Teams URL 中的 `groupId` 查询参数**不是**用于配置的团队 ID。请改从 URL 路径中提取 ID：

**团队 URL：**

```text
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**渠道 URL：**

```text
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**用于配置：**

- 团队键 = `/team/` 之后的路径段（URL 解码后，例如 `19:Bk4j...@thread.tacv2`；较旧租户可能显示 `@thread.skype`，这同样有效）。
- 渠道键 = `/channel/` 之后的路径段（URL 解码后）。
- **忽略**用于 OpenClaw 路由的 `groupId` 查询参数。它是 Microsoft Entra 群组 ID，而不是传入 Teams 活动中使用的 Bot Framework 对话 ID。

## 私有渠道

Bot 对私有渠道的支持有限：

| 功能 | 标准渠道 | 私有渠道 |
| ---------------------------- | ----------------- | ---------------------- |
| Bot 安装 | 是 | 有限 |
| 实时消息（webhook） | 是 | 可能无法工作 |
| RSC 权限 | 是 | 行为可能不同 |
| @提及 | 是 | 如果 bot 可访问 |
| Graph API 历史记录 | 是 | 是（需要权限） |

**如果私有渠道无法工作，可使用的变通方案：**

1. 对机器人交互使用标准渠道。
2. 使用私信；用户始终可以直接给机器人发消息。
3. 使用 Graph API 进行历史访问（需要 `ChannelMessage.Read.All`）。

## 故障排查

### 常见问题

- **图片未在渠道中显示：** 缺少 Graph 权限或管理员同意。重新安装 Teams 应用，并完全退出/重新打开 Teams。
- **渠道中没有响应：** 默认需要提及；设置 `channels.msteams.requireMention=false`，或按团队/渠道配置。
- **版本不匹配（Teams 仍显示旧清单）：** 移除并重新添加应用，然后完全退出 Teams 以刷新。
- **Webhook 返回 401 Unauthorized：** 手动测试时没有 Azure JWT 属于预期情况；这表示端点可访问，但认证失败。使用 Azure Web Chat 正确测试。

### 清单上传错误

- **“图标文件不能为空”：** 清单引用了 0 字节的图标文件。创建有效的 PNG 图标（`outline.png` 为 32x32，`color.png` 为 192x192）。
- **“webApplicationInfo.Id 已被使用”：** 该应用仍安装在另一个团队/聊天中。先找到并卸载它，或等待 5-10 分钟让变更传播。
- **上传时出现“出现问题”：** 改用 [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) 上传，打开浏览器 DevTools（F12）→ Network 标签页，并检查响应正文中的实际错误。
- **旁加载失败：** 尝试使用“将应用上传到组织的应用目录”，而不是“上传自定义应用”；这通常可以绕过旁加载限制。

### RSC 权限不生效

1. 验证 `webApplicationInfo.id` 与你的机器人的 App ID 完全匹配。
2. 重新上传应用，并在团队/聊天中重新安装。
3. 检查你的组织管理员是否阻止了 RSC 权限。
4. 确认你使用的是正确的作用域：团队使用 `ChannelMessage.Read.Group`，群聊使用 `ChatMessage.Read.Chat`。

## 参考资料

- [创建 Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot 设置指南
- [Teams 开发者门户](https://dev.teams.microsoft.com/apps) - 创建/管理 Teams 应用
- [Teams 应用清单架构](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [使用 RSC 接收渠道消息](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC 权限参考](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams 机器人文件处理](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4)（渠道/群组需要 Graph）
- [主动消息](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - 用于机器人管理的 Teams CLI

## 相关

- [渠道概览](/zh-CN/channels) - 所有支持的渠道
- [配对](/zh-CN/channels/pairing) - 私信认证和配对流程
- [群组](/zh-CN/channels/groups) - 群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) - 消息的会话路由
- [安全](/zh-CN/gateway/security) - 访问模型和加固
