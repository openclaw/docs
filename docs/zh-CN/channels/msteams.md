---
read_when:
    - 正在开发 Microsoft Teams 渠道功能
summary: Microsoft Teams 机器人支持状态、功能和配置
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-23T15:10:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 872318a0f4ec42efef3c13bc90b4af1b3875ade431bd314583ea2cdc038cdc7c
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> “进入此处者，放弃一切希望。”

状态：支持文本和私信附件；频道/群组文件发送需要 `sharePointSiteId` + Graph 权限（参见[在群聊中发送文件](#sending-files-in-group-chats)）。投票通过 Adaptive Cards 发送。消息操作会公开明确的 `upload-file`，用于优先发送文件的场景。

## 内置插件

Microsoft Teams 在当前的 OpenClaw 版本中作为内置插件提供，因此在常规打包构建中不需要单独安装。

如果你使用的是较旧的构建版本，或是不包含内置 Teams 的自定义安装，请手动安装它：

```bash
openclaw plugins install @openclaw/msteams
```

本地检出版本（当你从 git 仓库运行时）：

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

详情：[Plugins](/zh-CN/tools/plugin)

## 快速设置（新手）

1. 确保 Microsoft Teams 插件可用。
   - 当前打包发布的 OpenClaw 版本已默认内置该插件。
   - 较旧/自定义安装可使用上面的命令手动添加。
2. 创建一个 **Azure Bot**（App ID + 客户端密钥 + 租户 ID）。
3. 使用这些凭证配置 OpenClaw。
4. 通过公共 URL 或隧道暴露 `/api/messages`（默认端口为 3978）。
5. 安装 Teams 应用包并启动 Gateway 网关。

最小配置（客户端密钥）：

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

对于生产部署，建议使用[联合身份验证](#federated-authentication-certificate--managed-identity)（证书或托管身份），而不是客户端密钥。

注意：群聊默认被阻止（`channels.msteams.groupPolicy: "allowlist"`）。若要允许群组回复，请设置 `channels.msteams.groupAllowFrom`（或使用 `groupPolicy: "open"` 以允许任何成员，默认仍需提及）。

## 目标

- 通过 Teams 私信、群聊或频道与 OpenClaw 交流。
- 保持路由可预测：回复始终返回到消息到达时所在的渠道。
- 默认使用安全的渠道行为（除非另有配置，否则必须提及）。

## 配置写入

默认情况下，Microsoft Teams 允许写入由 `/config set|unset` 触发的配置更新（需要 `commands.config: true`）。

可通过以下方式禁用：

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## 访问控制（私信 + 群组）

**私信访问**

- 默认：`channels.msteams.dmPolicy = "pairing"`。未知发送者在获得批准前会被忽略。
- `channels.msteams.allowFrom` 应使用稳定的 AAD 对象 ID。
- UPN/显示名称可能变化；默认禁用直接匹配，仅在 `channels.msteams.dangerouslyAllowNameMatching: true` 时启用。
- 当凭证权限允许时，向导可通过 Microsoft Graph 将名称解析为 ID。

**群组访问**

- 默认：`channels.msteams.groupPolicy = "allowlist"`（除非你添加 `groupAllowFrom`，否则会被阻止）。当未设置时，可使用 `channels.defaults.groupPolicy` 覆盖默认值。
- `channels.msteams.groupAllowFrom` 控制哪些发送者可以在群聊/频道中触发（回退到 `channels.msteams.allowFrom`）。
- 设置 `groupPolicy: "open"` 可允许任何成员（默认仍需提及）。
- 若要**不允许任何频道**，请设置 `channels.msteams.groupPolicy: "disabled"`。

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

**Teams + 频道允许列表**

- 通过在 `channels.msteams.teams` 下列出 teams 和 channels，限制群组/频道回复范围。
- 键应使用稳定的 team ID 和 channel 会话 ID。
- 当 `groupPolicy="allowlist"` 且存在 teams 允许列表时，仅接受列出的 teams/channels（且需要提及）。
- 配置向导接受 `Team/Channel` 条目，并会帮你保存。
- 启动时，OpenClaw 会将 team/channel 和用户允许列表中的名称解析为 ID（当 Graph 权限允许时），并记录映射；未解析的 team/channel 名称会按输入原样保留，但默认会在路由中被忽略，除非启用了 `channels.msteams.dangerouslyAllowNameMatching: true`。

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

## Azure Bot 设置

在配置 OpenClaw 之前，请先创建一个 Azure Bot 资源并保存其凭证。

<Steps>
  <Step title="创建 Azure Bot">
    前往 [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)，填写 **Basics** 选项卡：

    | Field              | Value                                             |
    | ------------------ | ------------------------------------------------- |
    | **Bot handle**     | 你的机器人名称，例如 `openclaw-msteams`（必须唯一） |
    | **Subscription**   | 你的 Azure 订阅                                    |
    | **Resource group** | 新建或使用现有资源组                                |
    | **Pricing tier**   | 开发/测试请选择 **Free**                            |
    | **Type of App**    | 推荐使用 **Single Tenant**                         |
    | **Creation type**  | **Create new Microsoft App ID**                   |

    <Note>
    新的多租户 bot 已在 2025-07-31 之后弃用。新建 bot 请使用 **Single Tenant**。
    </Note>

    点击 **Review + create** → **Create**（等待约 1–2 分钟）。

  </Step>

  <Step title="获取凭证">
    在 Azure Bot 资源中，进入 **Configuration**：

    - 复制 **Microsoft App ID** → `appId`
    - 点击 **Manage Password** → **Certificates & secrets** → **New client secret** → 复制其值 → `appPassword`
    - 进入 **Overview** → **Directory (tenant) ID** → `tenantId`

  </Step>

  <Step title="配置消息端点">
    Azure Bot → **Configuration** → 设置 **Messaging endpoint**：

    - 生产环境：`https://your-domain.com/api/messages`
    - 本地开发：使用隧道（参见[本地开发](#local-development-tunneling)）

  </Step>

  <Step title="启用 Teams 渠道">
    Azure Bot → **Channels** → 点击 **Microsoft Teams** → Configure → Save。接受服务条款。
  </Step>
</Steps>

<a id="federated-authentication-certificate--managed-identity"></a>

## 联合身份验证

> 添加于 2026.3.24

对于生产部署，OpenClaw 支持将**联合身份验证**作为比客户端密钥更安全的替代方案。提供两种方式：

### 选项 A：基于证书的身份验证

使用在你的 Entra ID 应用注册中登记的 PEM 证书。

**设置：**

1. 生成或获取证书（带私钥的 PEM 格式）。
2. 在 Entra ID → App Registration → **Certificates & secrets** → **Certificates** 中上传公开证书。

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

使用 Azure Managed Identity 实现无密码身份验证。这非常适合部署在 Azure 基础设施上的场景（AKS、App Service、Azure VM），因为这些环境可提供托管身份。

**工作原理：**

1. bot 所在的 pod/VM 拥有托管身份（系统分配或用户分配）。
2. 一个**联合身份凭证**将该托管身份链接到 Entra ID 应用注册。
3. 在运行时，OpenClaw 使用 `@azure/identity` 从 Azure IMDS 端点（`169.254.169.254`）获取令牌。
4. 该令牌会传递给 Teams SDK，用于 bot 身份验证。

**前提条件：**

- 已启用托管身份的 Azure 基础设施（AKS workload identity、App Service、VM）
- 已在 Entra ID 应用注册上创建联合身份凭证
- pod/VM 可访问 IMDS（`169.254.169.254:80`）

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>`（仅用户分配场景需要）

### AKS workload identity 设置

对于使用 workload identity 的 AKS 部署：

1. 在 AKS 集群上**启用 workload identity**。
2. 在 Entra ID 应用注册上**创建联合身份凭证**：

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. 使用应用客户端 ID **为 Kubernetes service account 添加注解**：

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **为 pod 添加标签**，以启用 workload identity 注入：

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **确保可以访问 IMDS 网络地址**（`169.254.169.254`）——如果你使用 NetworkPolicy，请添加一条出口规则，允许访问 `169.254.169.254/32` 的 80 端口流量。

### 身份验证类型对比

| Method               | Config                                         | Pros                 | Cons                           |
| -------------------- | ---------------------------------------------- | -------------------- | ------------------------------ |
| **Client secret**    | `appPassword`                                  | 设置简单             | 需要轮换密钥，安全性较低       |
| **Certificate**      | `authType: "federated"` + `certificatePath`    | 无需通过网络共享密钥 | 证书管理有额外开销             |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | 无密码，无需管理密钥 | 需要 Azure 基础设施            |

**默认行为：** 当未设置 `authType` 时，OpenClaw 默认使用客户端密钥身份验证。现有配置无需修改即可继续工作。

## 本地开发（隧道）

Teams 无法访问 `localhost`。进行本地开发时请使用隧道：

**选项 A：ngrok**

```bash
ngrok http 3978
# 复制 https URL，例如 https://abc123.ngrok.io
# 将消息端点设置为：https://abc123.ngrok.io/api/messages
```

**选项 B：Tailscale Funnel**

```bash
tailscale funnel 3978
# 使用你的 Tailscale funnel URL 作为消息端点
```

## Teams Developer Portal（替代方式）

你也可以使用 [Teams Developer Portal](https://dev.teams.microsoft.com/apps)，而不是手动创建 manifest ZIP：

1. 点击 **+ New app**
2. 填写基本信息（名称、描述、开发者信息）
3. 进入 **App features** → **Bot**
4. 选择 **Enter a bot ID manually** 并粘贴你的 Azure Bot App ID
5. 勾选作用域：**Personal**、**Team**、**Group Chat**
6. 点击 **Distribute** → **Download app package**
7. 在 Teams 中：**Apps** → **Manage your apps** → **Upload a custom app** → 选择该 ZIP

这通常比手动编辑 JSON manifest 更容易。

## 测试机器人

**选项 A：Azure Web Chat（先验证 webhook）**

1. 在 Azure Portal 中，进入你的 Azure Bot 资源 → **Test in Web Chat**
2. 发送一条消息 —— 你应该能看到回复
3. 这可以在设置 Teams 之前确认你的 webhook 端点可正常工作

**选项 B：Teams（安装应用后）**

1. 安装 Teams 应用（侧载或组织目录）
2. 在 Teams 中找到该机器人并发送一条私信
3. 检查 Gateway 网关日志中的传入 activity

## 设置（最小纯文本配置）

1. **确保 Microsoft Teams 插件可用**
   - 当前打包发布的 OpenClaw 版本已默认内置该插件。
   - 较旧/自定义安装可手动添加：
     - 从 npm：`openclaw plugins install @openclaw/msteams`
     - 从本地检出：`openclaw plugins install ./path/to/local/msteams-plugin`

2. **机器人注册**
   - 创建一个 Azure Bot（见上文），并记录：
     - App ID
     - 客户端密钥（App password）
     - Tenant ID（单租户）

3. **Teams 应用 manifest**
   - 包含一个 `bot` 条目，其中 `botId = <App ID>`。
   - 作用域：`personal`、`team`、`groupChat`。
   - `supportsFiles: true`（个人作用域文件处理所必需）。
   - 添加 RSC 权限（见下文）。
   - 创建图标：`outline.png`（32x32）和 `color.png`（192x192）。
   - 将这三个文件一起打包为 zip：`manifest.json`、`outline.png`、`color.png`。

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
   - `MSTEAMS_AUTH_TYPE`（可选：`"secret"` 或 `"federated"`）
   - `MSTEAMS_CERTIFICATE_PATH`（联合身份验证 + 证书）
   - `MSTEAMS_CERTIFICATE_THUMBPRINT`（可选，身份验证并不要求）
   - `MSTEAMS_USE_MANAGED_IDENTITY`（联合身份验证 + 托管身份）
   - `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID`（仅用户分配的 MI 需要）

5. **机器人端点**
   - 将 Azure Bot Messaging Endpoint 设置为：
     - `https://<host>:3978/api/messages`（或你选择的路径/端口）。

6. **运行 Gateway 网关**
   - 当内置或手动安装的插件可用，且存在带有凭证的 `msteams` 配置时，Teams 渠道会自动启动。

## 成员信息操作

OpenClaw 为 Microsoft Teams 提供了基于 Graph 的 `member-info` 操作，因此智能体和自动化流程可以直接通过 Microsoft Graph 解析渠道成员详情（显示名称、邮箱、角色）。

要求：

- `Member.Read.Group` RSC 权限（已包含在推荐的 manifest 中）
- 对于跨 team 查询：需要带管理员同意的 `User.Read.All` Graph Application 权限

该操作受 `channels.msteams.actions.memberInfo` 控制（默认：当 Graph 凭证可用时启用）。

## 历史上下文

- `channels.msteams.historyLimit` 控制会包装进提示词中的最近频道/群组消息数量。
- 回退到 `messages.groupChat.historyLimit`。设置为 `0` 可禁用（默认 50）。
- 获取到的线程历史会按发送者允许列表（`allowFrom` / `groupAllowFrom`）进行过滤，因此线程上下文注入目前只包含来自允许发送者的消息。
- 引用的附件上下文（由 Teams 回复 HTML 派生的 `ReplyTo*`）目前会按收到时的原样传递。
- 换句话说，允许列表控制谁可以触发智能体；而当前只有特定的补充上下文路径会被过滤。
- 私信历史可通过 `channels.msteams.dmHistoryLimit`（用户轮次）进行限制。按用户覆盖：`channels.msteams.dms["<user_id>"].historyLimit`。

## 当前 Teams RSC 权限

这些是我们 Teams 应用 manifest 中**现有的 resourceSpecific 权限**。它们仅在安装了该应用的 team/chat 内生效。

**用于频道（team 作用域）：**

- `ChannelMessage.Read.Group`（Application）- 无需 @mention 即可接收所有频道消息
- `ChannelMessage.Send.Group`（Application）
- `Member.Read.Group`（Application）
- `Owner.Read.Group`（Application）
- `ChannelSettings.Read.Group`（Application）
- `TeamMember.Read.Group`（Application）
- `TeamSettings.Read.Group`（Application）

**用于群聊：**

- `ChatMessage.Read.Chat`（Application）- 无需 @mention 即可接收所有群聊消息

## Teams manifest 示例

包含所需字段的最小有效示例。请替换 ID 和 URL。

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
- `bots[].scopes` 必须包含你计划使用的界面（`personal`、`team`、`groupChat`）。
- `bots[].supportsFiles: true` 是个人作用域文件处理所必需的。
- 如果你希望处理频道流量，`authorization.permissions.resourceSpecific` 必须包含频道读取/发送权限。

### 更新现有应用

要更新已安装的 Teams 应用（例如添加 RSC 权限）：

1. 使用新设置更新你的 `manifest.json`
2. **递增 `version` 字段**（例如 `1.0.0` → `1.1.0`）
3. **重新打包为 zip**，包含 manifest 和图标（`manifest.json`、`outline.png`、`color.png`）
4. 上传新的 zip：
   - **选项 A（Teams Admin Center）：** Teams Admin Center → Teams apps → Manage apps → 找到你的应用 → Upload new version
   - **选项 B（侧载）：** 在 Teams 中 → Apps → Manage your apps → Upload a custom app
5. **对于 team 频道：** 在每个 team 中重新安装应用，新的权限才会生效
6. **完全退出并重新启动 Teams**（而不只是关闭窗口），以清除缓存的应用元数据

## 功能：仅 RSC 与 Graph

### 仅使用 Teams RSC（无 Graph API 权限）

可用：

- 读取频道消息的**文本**内容。
- 发送频道消息的**文本**内容。
- 接收**个人（私信）**文件附件。

不可用：

- 频道/群组中的**图片或文件内容**（payload 仅包含 HTML 占位内容）。
- 下载存储在 SharePoint/OneDrive 中的附件。
- 读取消息历史（超出实时 webhook 事件范围）。

### Teams RSC 加 Microsoft Graph Application 权限

新增能力：

- 下载托管内容（粘贴到消息中的图片）。
- 下载存储在 SharePoint/OneDrive 中的文件附件。
- 通过 Graph 读取频道/chat 消息历史。

### RSC 与 Graph API 对比

| Capability              | RSC Permissions   | Graph API                         |
| ----------------------- | ----------------- | --------------------------------- |
| **Real-time messages**  | 是（通过 webhook） | 否（仅轮询）                      |
| **Historical messages** | 否                | 是（可查询历史）                  |
| **Setup complexity**    | 仅应用 manifest   | 需要管理员同意 + 令牌流程         |
| **Works offline**       | 否（必须正在运行） | 是（可随时查询）                  |

**结论：** RSC 用于实时监听；Graph API 用于历史访问。如果你希望在离线期间补回错过的消息，则需要带 `ChannelMessage.Read.All` 的 Graph API（需要管理员同意）。

## 启用 Graph 的媒体 + 历史记录（频道必需）

如果你在**频道**中需要图片/文件，或希望获取**消息历史记录**，则必须启用 Microsoft Graph 权限并授予管理员同意。

1. 在 Entra ID（Azure AD）**App Registration** 中，添加 Microsoft Graph **Application permissions**：
   - `ChannelMessage.Read.All`（频道附件 + 历史记录）
   - `Chat.Read.All` 或 `ChatMessage.Read.All`（群聊）
2. 为租户**授予管理员同意**。
3. 提升 Teams 应用 **manifest version**，重新上传，并且**在 Teams 中重新安装应用**。
4. **完全退出并重新启动 Teams**，以清除缓存的应用元数据。

**用户提及的附加权限：** 对于当前对话中的用户，用户 @mention 开箱即用。不过，如果你想动态搜索并提及**当前对话之外**的用户，请添加 `User.Read.All`（Application）权限并授予管理员同意。

## 已知限制

### Webhook 超时

Teams 通过 HTTP webhook 投递消息。如果处理耗时过长（例如 LLM 响应较慢），你可能会看到：

- Gateway 网关超时
- Teams 重试该消息（导致重复）
- 回复丢失

OpenClaw 会通过快速返回并主动发送回复来处理这种情况，但极慢的响应仍可能引发问题。

### 格式化

Teams 的 markdown 能力比 Slack 或 Discord 更有限：

- 基本格式可用：**粗体**、_斜体_、`code`、链接
- 复杂 markdown（表格、嵌套列表）可能无法正确渲染
- Adaptive Cards 支持用于投票和语义化展示发送（见下文）

## 配置

分组设置（共享渠道模式参见 `/gateway/configuration`）。

<AccordionGroup>
  <Accordion title="核心与 webhook">
    - `channels.msteams.enabled`
    - `channels.msteams.appId`、`appPassword`、`tenantId`：机器人凭证
    - `channels.msteams.webhook.port`（默认 `3978`）
    - `channels.msteams.webhook.path`（默认 `/api/messages`）
  </Accordion>

  <Accordion title="身份验证">
    - `authType`：`"secret"`（默认）或 `"federated"`
    - `certificatePath`、`certificateThumbprint`：联合身份验证 + 证书身份验证（thumbprint 可选）
    - `useManagedIdentity`、`managedIdentityClientId`：联合身份验证 + 托管身份身份验证
  </Accordion>

  <Accordion title="访问控制">
    - `dmPolicy`：`pairing | allowlist | open | disabled`（默认：pairing）
    - `allowFrom`：私信允许列表，推荐使用 AAD 对象 ID；当 Graph 访问可用时，向导会解析名称
    - `dangerouslyAllowNameMatching`：用于可变 UPN/显示名称及 team/channel 名称路由的紧急放行开关
    - `requireMention`：在频道/群组中要求 @mention（默认 `true`）
  </Accordion>

  <Accordion title="Team 和频道覆盖">
    所有这些设置都会覆盖顶层默认值：

    - `teams.<teamId>.replyStyle`、`.requireMention`
    - `teams.<teamId>.tools`、`.toolsBySender`：按 team 设置的工具策略默认值
    - `teams.<teamId>.channels.<conversationId>.replyStyle`、`.requireMention`
    - `teams.<teamId>.channels.<conversationId>.tools`、`.toolsBySender`

    `toolsBySender` 键接受 `id:`、`e164:`、`username:`、`name:` 前缀（无前缀键映射到 `id:`）。`"*"` 是通配符。

  </Accordion>

  <Accordion title="投递、媒体和操作">
    - `textChunkLimit`：出站文本分块大小
    - `chunkMode`：`length`（默认）或 `newline`（先按段落边界拆分，再按长度拆分）
    - `mediaAllowHosts`：入站附件主机允许列表（默认包含 Microsoft/Teams 域名）
    - `mediaAuthAllowHosts`：重试时可接收 Authorization 头的主机（默认包含 Graph + Bot Framework）
    - `replyStyle`：`thread | top-level`（参见[回复样式](#reply-style-threads-vs-posts)）
    - `actions.memberInfo`：切换基于 Graph 的成员信息操作（默认在 Graph 可用时开启）
    - `sharePointSiteId`：群聊/频道中文件上传所必需（参见[在群聊中发送文件](#sending-files-in-group-chats)）
  </Accordion>
</AccordionGroup>

## 路由和会话

- 会话键遵循标准智能体格式（参见 [/concepts/session](/zh-CN/concepts/session)）：
  - 私信共享主会话（`agent:<agentId>:<mainKey>`）。
  - 频道/群组消息使用会话 ID：
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 回复样式：线程 vs 发帖

Teams 最近在相同的底层数据模型之上引入了两种频道 UI 样式：

| Style                    | Description                            | Recommended `replyStyle` |
| ------------------------ | -------------------------------------- | ------------------------ |
| **Posts**（经典）        | 消息显示为卡片，下方带线程回复         | `thread`（默认）         |
| **Threads**（类似 Slack） | 消息线性流动，更像 Slack               | `top-level`              |

**问题：** Teams API 不会公开频道使用的是哪种 UI 样式。如果你使用了错误的 `replyStyle`：

- 在 Threads 样式的频道中使用 `thread` → 回复会以别扭的嵌套方式显示
- 在 Posts 样式的频道中使用 `top-level` → 回复会显示为单独的顶层发帖，而不是在线程内

**解决方案：** 根据频道的实际设置，按频道配置 `replyStyle`：

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

## 附件和图片

**当前限制：**

- **私信：** 图片和文件附件可通过 Teams bot 文件 API 正常工作。
- **频道/群组：** 附件保存在 M365 存储（SharePoint/OneDrive）中。webhook payload 仅包含一个 HTML 占位内容，而不包含实际文件字节。**下载频道附件需要 Graph API 权限**。
- 对于显式的优先发送文件场景，请使用 `action=upload-file`，并配合 `media` / `filePath` / `path`；可选的 `message` 会作为附带文本/评论，`filename` 会覆盖上传名称。

如果没有 Graph 权限，带图片的频道消息会以纯文本形式接收（机器人无法访问图片内容）。
默认情况下，OpenClaw 仅从 Microsoft/Teams 主机名下载媒体。可通过 `channels.msteams.mediaAllowHosts` 覆盖（使用 `["*"]` 允许任意主机）。
Authorization 头只会附加到 `channels.msteams.mediaAuthAllowHosts` 中的主机（默认包含 Graph + Bot Framework 主机）。请保持该列表严格受限（避免多租户后缀）。

## 在群聊中发送文件

机器人可以在私信中使用 FileConsentCard 流程发送文件（内置支持）。但是，**在群聊/频道中发送文件**需要额外设置：

| Context                  | How files are sent                    | Setup needed                                    |
| ------------------------ | ------------------------------------- | ----------------------------------------------- |
| **私信**                 | FileConsentCard → 用户接受 → 机器人上传 | 开箱即用                                        |
| **群聊/频道**            | 上传到 SharePoint → 分享链接          | 需要 `sharePointSiteId` + Graph 权限            |
| **图片（任意上下文）**   | Base64 编码内联                        | 开箱即用                                        |

### 为什么群聊需要 SharePoint

机器人没有个人 OneDrive drive（`/me/drive` Graph API 端点不适用于应用身份）。要在群聊/频道中发送文件，机器人会上传到一个 **SharePoint site** 并创建共享链接。

### 设置

1. 在 Entra ID（Azure AD）→ App Registration 中**添加 Graph API 权限**：
   - `Sites.ReadWrite.All`（Application）- 上传文件到 SharePoint
   - `Chat.Read.All`（Application）- 可选，用于启用按用户的共享链接

2. 为租户**授予管理员同意**。

3. **获取你的 SharePoint site ID：**

   ```bash
   # 通过 Graph Explorer 或使用有效令牌配合 curl：
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

| Permission                              | Sharing behavior                               |
| --------------------------------------- | ---------------------------------------------- |
| `Sites.ReadWrite.All` only              | 组织范围共享链接（组织内任何人都可访问）       |
| `Sites.ReadWrite.All` + `Chat.Read.All` | 按用户共享链接（仅聊天成员可访问）             |

按用户共享更安全，因为只有聊天参与者可以访问该文件。如果缺少 `Chat.Read.All` 权限，机器人会回退到组织范围共享。

### 回退行为

| Scenario                                          | Result                                       |
| ------------------------------------------------- | -------------------------------------------- |
| 群聊 + 文件 + 已配置 `sharePointSiteId`           | 上传到 SharePoint，发送共享链接              |
| 群聊 + 文件 + 无 `sharePointSiteId`               | 尝试上传到 OneDrive（可能失败），仅发送文本  |
| 个人聊天 + 文件                                   | FileConsentCard 流程（无需 SharePoint 即可工作） |
| 任意上下文 + 图片                                 | Base64 编码内联（无需 SharePoint 即可工作）  |

### 文件存储位置

上传的文件存储在已配置 SharePoint site 默认文档库中的 `/OpenClawShared/` 文件夹下。

## 投票（Adaptive Cards）

OpenClaw 通过 Adaptive Cards 发送 Teams 投票（Teams 没有原生投票 API）。

- CLI：`openclaw message poll --channel msteams --target conversation:<id> ...`
- 投票由 Gateway 网关记录在 `~/.openclaw/msteams-polls.json` 中。
- Gateway 网关必须保持在线才能记录投票。
- 投票目前还不会自动发布结果摘要（如有需要，请检查存储文件）。

## 展示卡片

使用 `message` 工具或 CLI 向 Teams 用户或会话发送语义化展示 payload。OpenClaw 会根据通用展示契约将其渲染为 Teams Adaptive Cards。

`presentation` 参数接受语义块。提供 `presentation` 时，消息文本为可选项。

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

关于目标格式的详细信息，参见下方的[目标格式](#target-formats)。

## 目标格式

MSTeams 目标使用前缀来区分用户和会话：

| Target type         | Format                           | Example                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| 用户（按 ID）       | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| 用户（按名称）      | `user:<display-name>`            | `user:John Smith`（需要 Graph API）                 |
| 群组/频道           | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| 群组/频道（原始）   | `<conversation-id>`              | `19:abc123...@thread.tacv2`（如果包含 `@thread`）   |

**CLI 示例：**

```bash
# 按 ID 向用户发送
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# 按显示名称向用户发送（会触发 Graph API 查找）
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# 发送到群聊或频道
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# 向会话发送展示卡片
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

注意：如果没有 `user:` 前缀，名称默认按群组/team 解析。按显示名称指定个人时，请始终使用 `user:`。

## 主动消息

- 主动消息只有在用户已经交互**之后**才可发送，因为我们会在那时保存会话引用。
- 关于 `dmPolicy` 和允许列表限制，参见 `/gateway/configuration`。

## Team 和频道 ID

Teams URL 中的 `groupId` 查询参数**不是**配置中使用的 team ID。请从 URL 路径中提取 ID：

**Team URL：**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team ID（对其进行 URL 解码）
```

**频道 URL：**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID（对其进行 URL 解码）
```

**用于配置：**

- Team ID = `/team/` 之后的路径段（URL 解码后，例如 `19:Bk4j...@thread.tacv2`）
- Channel ID = `/channel/` 之后的路径段（URL 解码后）
- **忽略** `groupId` 查询参数

## 私有频道

机器人在私有频道中的支持有限：

| Feature                      | Standard Channels | Private Channels |
| ---------------------------- | ----------------- | ---------------- |
| 机器人安装                   | 是                | 有限             |
| 实时消息（webhook）          | 是                | 可能无法工作     |
| RSC 权限                     | 是                | 行为可能不同     |
| @mentions                    | 是                | 如果机器人可访问 |
| Graph API 历史记录           | 是                | 是（有权限时）   |

**如果私有频道无法工作，可使用以下变通方案：**

1. 对于机器人交互，使用标准频道
2. 使用私信 —— 用户始终可以直接给机器人发消息
3. 使用 Graph API 访问历史记录（需要 `ChannelMessage.Read.All`）

## 故障排除

### 常见问题

- **频道中图片不显示：** 缺少 Graph 权限或管理员同意。请重新安装 Teams 应用，并完全退出后重新打开 Teams。
- **频道中没有响应：** 默认要求提及；请设置 `channels.msteams.requireMention=false`，或按 team/频道进行配置。
- **版本不匹配（Teams 仍显示旧 manifest）：** 移除并重新添加应用，然后完全退出 Teams 以刷新。
- **webhook 返回 401 Unauthorized：** 如果你在没有 Azure JWT 的情况下手动测试，这是预期行为 —— 说明端点可达，但身份验证失败。请使用 Azure Web Chat 正确测试。

### Manifest 上传错误

- **“Icon file cannot be empty”：** manifest 引用了大小为 0 字节的图标文件。请创建有效的 PNG 图标（`outline.png` 为 32x32，`color.png` 为 192x192）。
- **“webApplicationInfo.Id already in use”：** 该应用仍安装在另一个 team/chat 中。请先找到并卸载它，或等待 5–10 分钟让更改传播。
- **上传时出现 “Something went wrong”：** 请改用 [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) 上传，打开浏览器 DevTools（F12）→ Network 选项卡，并检查响应体中的实际错误信息。
- **侧载失败：** 请尝试使用 “Upload an app to your org's app catalog”，而不是 “Upload a custom app” —— 这通常可以绕过侧载限制。

### RSC 权限不起作用

1. 验证 `webApplicationInfo.id` 是否与你机器人的 App ID 完全一致
2. 重新上传应用，并在 team/chat 中重新安装
3. 检查你的组织管理员是否阻止了 RSC 权限
4. 确认你使用了正确的作用域：team 使用 `ChannelMessage.Read.Group`，群聊使用 `ChatMessage.Read.Chat`

## 参考资料

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot 设置指南
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - 创建/管理 Teams 应用
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema) - Teams 应用 manifest schema
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc) - 使用 RSC 接收频道消息
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent) - RSC 权限参考
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4)（频道/群组需要 Graph）
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages) - 主动消息

## 相关内容

- [Channels Overview](/zh-CN/channels) — 所有支持的渠道
- [Pairing](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [Groups](/zh-CN/channels/groups) — 群聊行为和提及限制
- [Channel Routing](/zh-CN/channels/channel-routing) — 消息的会话路由
- [Security](/zh-CN/gateway/security) — 访问模型和加固
