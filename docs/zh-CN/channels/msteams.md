---
read_when:
    - 正在开发 Microsoft Teams 渠道功能
summary: Microsoft Teams 机器人支持状态、功能和配置
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-27T07:23:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 243ef0e16429060605ac19ed8d49c6078b6823f3fc94eafd7ea08522db9d13e9
    source_path: channels/msteams.md
    workflow: 15
---

Status：支持文本 + 私信附件；渠道/群组文件发送需要 `sharePointSiteId` + Graph 权限（参见 [在群组聊天中发送文件](#sending-files-in-group-chats)）。投票通过 Adaptive Cards 发送。消息操作提供显式的 `upload-file`，用于以文件为先的发送。

## 内置插件

Microsoft Teams 在当前的 OpenClaw 版本中作为内置插件提供，因此在常规打包构建中不需要单独安装。

如果你使用的是较旧的构建版本，或是不包含内置 Teams 的自定义安装，请手动安装：

```bash
openclaw plugins install @openclaw/msteams
```

本地检出版本（从 git 仓库运行时）：

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

详情： [Plugins](/zh-CN/tools/plugin)

## 快速开始

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) 可通过一条命令完成机器人注册、清单创建和凭证生成。

**1. 安装并登录**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # 验证你已登录，并查看你的租户信息
```

<Note>
Teams CLI 当前仍处于预览版。命令和标志可能会在不同版本之间发生变化。
</Note>

**2. 启动隧道**（Teams 无法访问 localhost）

如果你还没有安装 devtunnel CLI，请先安装并完成身份验证（参见[入门指南](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)）。

```bash
# 一次性设置（跨会话保持持久 URL）：
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# 每次开发会话：
devtunnel host my-openclaw-bot
# 你的端点：https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
必须使用 `--allow-anonymous`，因为 Teams 无法通过 devtunnels 进行身份验证。每个传入的机器人请求仍会由 Teams SDK 自动验证。
</Note>

替代方案：`ngrok http 3978` 或 `tailscale funnel 3978`（但这些方案可能会在每次会话中更改 URL）。

**3. 创建应用**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

这条命令会一次性完成以下操作：

- 创建 Entra ID（Azure AD）应用
- 生成客户端密钥
- 构建并上传 Teams 应用清单（包含图标）
- 注册机器人（默认由 Teams 托管 —— 无需 Azure 订阅）

输出中会显示 `CLIENT_ID`、`CLIENT_SECRET`、`TENANT_ID` 和一个 **Teams App ID** —— 请记下这些值，以便用于后续步骤。它还会提示你直接在 Teams 中安装该应用。

**4. 配置 OpenClaw**，使用输出中的凭证：

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

`teams app create` 会提示你安装该应用 —— 选择“Install in Teams”。如果你跳过了这一步，稍后可以获取链接：

```bash
teams app get <teamsAppId> --install-link
```

**6. 验证一切正常**

```bash
teams app doctor <teamsAppId>
```

这会对机器人注册、AAD 应用配置、清单有效性和 SSO 设置运行诊断。

对于生产部署，建议考虑使用[联合身份验证](/zh-CN/channels/msteams#federated-authentication-certificate-plus-managed-identity)（证书或托管身份）来替代客户端密钥。

<Note>
默认会阻止群组聊天（`channels.msteams.groupPolicy: "allowlist"`）。如需允许群组回复，请设置 `channels.msteams.groupAllowFrom`，或使用 `groupPolicy: "open"` 以允许任意成员（默认仍需提及）。
</Note>

## 目标

- 通过 Teams 私信、群组聊天或渠道与 OpenClaw 对话。
- 保持路由确定性：回复始终返回到消息到达时所在的渠道。
- 默认采用安全的渠道行为（除非另有配置，否则必须提及）。

## 配置写入

默认情况下，Microsoft Teams 被允许写入由 `/config set|unset` 触发的配置更新（需要 `commands.config: true`）。

如需禁用：

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## 访问控制（私信 + 群组）

**私信访问**

- 默认：`channels.msteams.dmPolicy = "pairing"`。未知发送者会被忽略，直到获得批准。
- `channels.msteams.allowFrom` 应使用稳定的 AAD 对象 ID。
- 不要依赖 UPN/显示名称匹配来实现 allowlist —— 它们可能会变化。OpenClaw 默认禁用直接名称匹配；如需启用，请显式设置 `channels.msteams.dangerouslyAllowNameMatching: true`。
- 当凭证权限允许时，向导可以通过 Microsoft Graph 将名称解析为 ID。

**群组访问**

- 默认：`channels.msteams.groupPolicy = "allowlist"`（除非你添加 `groupAllowFrom`，否则会被阻止）。使用 `channels.defaults.groupPolicy` 可在未设置时覆盖默认值。
- `channels.msteams.groupAllowFrom` 控制哪些发送者可以在群组聊天/渠道中触发（回退到 `channels.msteams.allowFrom`）。
- 设置 `groupPolicy: "open"` 可允许任意成员（默认仍需提及）。
- 如需**禁止所有渠道**，请设置 `channels.msteams.groupPolicy: "disabled"`。

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
- 当 `groupPolicy="allowlist"` 且存在 teams allowlist 时，只接受列出的团队/渠道（需提及）。
- 配置向导接受 `Team/Channel` 条目并会为你保存。
- 启动时，OpenClaw 会将团队/渠道和用户 allowlist 名称解析为 ID（当 Graph 权限允许时），并记录映射；
  未能解析的团队/渠道名称会按原样保留，但默认会在路由中被忽略，除非启用 `channels.msteams.dangerouslyAllowNameMatching: true`。

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
3. 构建一个引用该机器人的 **Teams 应用包**，并包含下方的 RSC 权限。
4. 将 Teams 应用上传/安装到团队中（或用于私信的个人范围）。
5. 在 `~/.openclaw/openclaw.json` 中配置 `msteams`（或使用环境变量），然后启动 Gateway 网关。
6. Gateway 网关 默认在 `/api/messages` 上监听 Bot Framework webhook 流量。

### 第 1 步：创建 Azure Bot

1. 前往 [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. 填写 **Basics** 选项卡：

   | Field              | Value                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | 你的机器人名称，例如 `openclaw-msteams`（必须唯一） |
   | **Subscription**   | 选择你的 Azure 订阅 |
   | **Resource group** | 新建或使用现有资源组 |
   | **Pricing tier**   | 开发/测试使用 **Free** |
   | **Type of App**    | **Single Tenant**（推荐 —— 见下方说明） |
   | **Creation type**  | **Create new Microsoft App ID** |

<Warning>
在 2025-07-31 之后，新建多租户机器人已被弃用。新机器人请使用 **Single Tenant**。
</Warning>

3. 点击 **Review + create** → **Create**（等待约 1–2 分钟）

### 第 2 步：获取凭证

1. 前往你的 Azure Bot 资源 → **Configuration**
2. 复制 **Microsoft App ID** → 这就是你的 `appId`
3. 点击 **Manage Password** → 前往应用注册
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

### 第 5 步：构建 Teams 应用清单

- 包含一个 `bot` 条目，其中 `botId = <App ID>`。
- 作用域：`personal`、`team`、`groupChat`。
- `supportsFiles: true`（个人作用域文件处理所必需）。
- 添加 RSC 权限（参见 [RSC Permissions](#current-teams-rsc-permissions-manifest)）。
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

当插件可用且存在带有凭证的 `msteams` 配置时，Teams 渠道会自动启动。

</details>

## 联合身份验证（证书 + 托管身份）

> 添加于 2026.3.24

对于生产部署，OpenClaw 支持 **联合身份验证**，作为比客户端密钥更安全的替代方案。当前提供两种方式：

### 选项 A：基于证书的身份验证

使用已注册到你的 Entra ID 应用注册中的 PEM 证书。

**设置：**

1. 生成或获取一个证书（PEM 格式，包含私钥）。
2. 在 Entra ID → 应用注册 → **Certificates & secrets** → **Certificates** → 上传公钥证书。

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

使用 Azure 托管身份实现无密码身份验证。这非常适合部署在 Azure 基础设施（AKS、App Service、Azure VM）上的场景，因为这些环境可提供托管身份。

**工作原理：**

1. 机器人所在的 pod/VM 拥有一个托管身份（系统分配或用户分配）。
2. 一个 **联合身份凭证** 将该托管身份关联到 Entra ID 应用注册。
3. 运行时，OpenClaw 使用 `@azure/identity` 从 Azure IMDS 端点（`169.254.169.254`）获取令牌。
4. 该令牌会传递给 Teams SDK，用于机器人身份验证。

**前置条件：**

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

3. 使用应用客户端 ID **为 Kubernetes service account 添加注解**：

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. 为 **pod 添加标签**，以启用 workload identity 注入：

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **确保可访问网络**到 IMDS（`169.254.169.254`）—— 如果你使用 NetworkPolicy，请添加一条出站规则，允许到 `169.254.169.254/32` 的 80 端口流量。

### 身份验证类型对比

| Method               | Config                                         | Pros                               | Cons                                  |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Client secret**    | `appPassword`                                  | 设置简单 | 需要轮换密钥，安全性较低 |
| **Certificate**      | `authType: "federated"` + `certificatePath`    | 无需通过网络共享密钥 | 证书管理有额外开销 |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | 无密码，无需管理密钥 | 需要 Azure 基础设施 |

**默认行为：** 当未设置 `authType` 时，OpenClaw 默认使用客户端密钥身份验证。现有配置无需修改即可继续工作。

## 本地开发（隧道）

Teams 无法访问 `localhost`。请使用持久化开发隧道，以便你的 URL 在不同会话之间保持不变：

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

这会一次性检查机器人注册、AAD 应用、清单和 SSO 配置。

**发送测试消息：**

1. 安装 Teams 应用（使用 `teams app get <id> --install-link` 提供的安装链接）
2. 在 Teams 中找到该机器人并发送一条私信
3. 检查 Gateway 网关 日志中的传入活动

## 环境变量

所有配置键也都可以通过环境变量设置：

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE`（可选：`"secret"` 或 `"federated"`）
- `MSTEAMS_CERTIFICATE_PATH`（联合身份验证 + 证书）
- `MSTEAMS_CERTIFICATE_THUMBPRINT`（可选，身份验证不要求）
- `MSTEAMS_USE_MANAGED_IDENTITY`（联合身份验证 + 托管身份）
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID`（仅用于用户分配的 MI）

## 成员信息操作

OpenClaw 为 Microsoft Teams 提供了基于 Graph 的 `member-info` 操作，因此智能体和自动化可以直接通过 Microsoft Graph 解析渠道成员详情（显示名称、电子邮件、角色）。

要求：

- `Member.Read.Group` RSC 权限（已包含在推荐清单中）
- 对于跨团队查询：具有管理员同意的 `User.Read.All` Graph 应用程序权限

该操作由 `channels.msteams.actions.memberInfo` 控制（默认：当 Graph 凭证可用时启用）。

## 历史上下文

- `channels.msteams.historyLimit` 控制会包装进提示中的最近渠道/群组消息数量。
- 回退到 `messages.groupChat.historyLimit`。设置为 `0` 可禁用（默认值为 50）。
- 获取到的线程历史会按发送者 allowlist（`allowFrom` / `groupAllowFrom`）进行过滤，因此线程上下文播种仅包含来自允许发送者的消息。
- 引用的附件上下文（从 Teams 回复 HTML 派生的 `ReplyTo*`）当前会按接收原样传递。
- 换句话说，allowlist 控制谁可以触发智能体；目前只有特定的补充上下文路径会被过滤。
- 私信历史可通过 `channels.msteams.dmHistoryLimit`（用户轮次）进行限制。按用户覆盖：`channels.msteams.dms["<user_id>"].historyLimit`。

## 当前 Teams RSC 权限（清单）

这些是我们 Teams 应用清单中**现有的 resourceSpecific 权限**。它们仅在安装该应用的团队/聊天内部生效。

**用于渠道（团队作用域）：**

- `ChannelMessage.Read.Group`（Application）- 无需 @mention 即可接收所有渠道消息
- `ChannelMessage.Send.Group`（Application）
- `Member.Read.Group`（Application）
- `Owner.Read.Group`（Application）
- `ChannelSettings.Read.Group`（Application）
- `TeamMember.Read.Group`（Application）
- `TeamSettings.Read.Group`（Application）

**用于群组聊天：**

- `ChatMessage.Read.Chat`（Application）- 无需 @mention 即可接收所有群组聊天消息

要通过 Teams CLI 添加 RSC 权限：

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Teams 清单示例（已脱敏）

这是一个包含所需字段的最小有效示例。请替换其中的 ID 和 URL。

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

### 清单注意事项（必需字段）

- `bots[].botId` **必须**与 Azure Bot App ID 匹配。
- `webApplicationInfo.id` **必须**与 Azure Bot App ID 匹配。
- `bots[].scopes` 必须包含你计划使用的表面（`personal`、`team`、`groupChat`）。
- `bots[].supportsFiles: true` 是个人作用域中文件处理的必需项。
- 如果你希望处理渠道流量，`authorization.permissions.resourceSpecific` 必须包含渠道读取/发送权限。

### 更新现有应用

如需更新已安装的 Teams 应用（例如添加 RSC 权限）：

```bash
# 下载、编辑并重新上传清单
teams app manifest download <teamsAppId> manifest.json
# 在本地编辑 manifest.json...
teams app manifest upload manifest.json <teamsAppId>
# 如果内容发生变化，版本号会自动递增
```

更新后，请在每个团队中重新安装该应用以使新权限生效，并且**完全退出并重新启动 Teams**（而不只是关闭窗口），以清除缓存的应用元数据。

<details>
<summary>手动更新清单（不使用 CLI）</summary>

1. 使用新设置更新你的 `manifest.json`
2. **递增 `version` 字段**（例如 `1.0.0` → `1.1.0`）
3. **重新打包为 zip**，包含清单和图标（`manifest.json`、`outline.png`、`color.png`）
4. 上传新的 zip：
   - **Teams Admin Center：** Teams apps → Manage apps → 找到你的应用 → Upload new version
   - **旁加载：** 在 Teams 中 → Apps → Manage your apps → Upload a custom app

</details>

## 功能：仅 RSC 与 Graph 的区别

### 使用**仅 Teams RSC**（已安装应用，无 Graph API 权限）时

可用：

- 读取渠道消息**文本**内容。
- 发送渠道消息**文本**内容。
- 接收**个人（私信）**文件附件。

不可用：

- 渠道/群组中的**图片或文件内容**（负载仅包含 HTML 占位内容）。
- 下载存储在 SharePoint/OneDrive 中的附件。
- 读取消息历史记录（超出实时 webhook 事件之外的内容）。

### 使用**Teams RSC + Microsoft Graph Application permissions** 时

新增：

- 下载托管内容（粘贴到消息中的图片）。
- 下载存储在 SharePoint/OneDrive 中的文件附件。
- 通过 Graph 读取渠道/聊天消息历史。

### RSC 与 Graph API

| Capability              | RSC Permissions      | Graph API                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **Real-time messages**  | 是（通过 webhook） | 否（仅支持轮询） |
| **Historical messages** | 否 | 是（可查询历史） |
| **Setup complexity**    | 仅需应用清单 | 需要管理员同意 + 令牌流程 |
| **Works offline**       | 否（必须保持运行） | 是（可随时查询） |

**结论：** RSC 用于实时监听；Graph API 用于历史访问。如果你想在离线期间补收漏掉的消息，就需要使用带有 `ChannelMessage.Read.All` 的 Graph API（需要管理员同意）。

## 启用 Graph 的媒体 + 历史记录（渠道必需）

如果你需要处理**渠道**中的图片/文件，或想获取**消息历史**，则必须启用 Microsoft Graph 权限并授予管理员同意。

1. 在 Entra ID（Azure AD）**应用注册**中，添加 Microsoft Graph **应用程序权限**：
   - `ChannelMessage.Read.All`（渠道附件 + 历史）
   - `Chat.Read.All` 或 `ChatMessage.Read.All`（群组聊天）
2. 为租户**授予管理员同意**。
3. 递增 Teams 应用**清单版本号**，重新上传，并在 Teams 中**重新安装应用**。
4. **完全退出并重新启动 Teams**，以清除缓存的应用元数据。

**用户提及的附加权限：** 对于当前对话中的用户，用户 @mention 开箱即用。但是，如果你想动态搜索并提及**当前对话之外**的用户，请添加 `User.Read.All`（Application）权限并授予管理员同意。

## 已知限制

### Webhook 超时

Teams 通过 HTTP webhook 投递消息。如果处理耗时过长（例如 LLM 响应较慢），你可能会看到：

- Gateway 网关 超时
- Teams 重试该消息（导致重复）
- 回复丢失

OpenClaw 通过快速返回并主动发送回复来处理这一点，但在响应非常慢时仍然可能出现问题。

### 格式化

Teams 的 markdown 能力比 Slack 或 Discord 更有限：

- 基础格式可用：**粗体**、_斜体_、`code`、链接
- 复杂 markdown（表格、嵌套列表）可能无法正确渲染
- 支持使用 Adaptive Cards 进行投票和语义化展示发送（见下文）

## 配置

关键设置（共享渠道模式参见 `/gateway/configuration`）：

- `channels.msteams.enabled`：启用/禁用该渠道。
- `channels.msteams.appId`、`channels.msteams.appPassword`、`channels.msteams.tenantId`：机器人凭证。
- `channels.msteams.webhook.port`（默认值 `3978`）
- `channels.msteams.webhook.path`（默认值 `/api/messages`）
- `channels.msteams.dmPolicy`：`pairing | allowlist | open | disabled`（默认：pairing）
- `channels.msteams.allowFrom`：私信 allowlist（建议使用 AAD 对象 ID）。当 Graph 访问可用时，向导会在设置期间将名称解析为 ID。
- `channels.msteams.dangerouslyAllowNameMatching`：紧急开关，用于重新启用可变的 UPN/显示名称匹配，以及直接的团队/渠道名称路由。
- `channels.msteams.textChunkLimit`：出站文本分块大小。
- `channels.msteams.chunkMode`：`length`（默认）或 `newline`，先按空行（段落边界）拆分，再按长度分块。
- `channels.msteams.mediaAllowHosts`：传入附件主机的 allowlist（默认是 Microsoft/Teams 域名）。
- `channels.msteams.mediaAuthAllowHosts`：媒体重试时允许附加 Authorization 头的主机 allowlist（默认是 Graph + Bot Framework 主机）。
- `channels.msteams.requireMention`：在渠道/群组中要求 @mention（默认值为 true）。
- `channels.msteams.replyStyle`：`thread | top-level`（参见 [回复样式](#reply-style-threads-vs-posts)）。
- `channels.msteams.teams.<teamId>.replyStyle`：按团队覆盖。
- `channels.msteams.teams.<teamId>.requireMention`：按团队覆盖。
- `channels.msteams.teams.<teamId>.tools`：按团队的默认工具策略覆盖（`allow`/`deny`/`alsoAllow`），当渠道覆盖缺失时使用。
- `channels.msteams.teams.<teamId>.toolsBySender`：按团队、按发送者的默认工具策略覆盖（支持 `"*"` 通配符）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`：按渠道覆盖。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`：按渠道覆盖。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`：按渠道的工具策略覆盖（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`：按渠道、按发送者的工具策略覆盖（支持 `"*"` 通配符）。
- `toolsBySender` 键应使用显式前缀：
  `id:`、`e164:`、`username:`、`name:`（旧版无前缀键仍只映射到 `id:`）。
- `channels.msteams.actions.memberInfo`：启用或禁用基于 Graph 的成员信息操作（默认：当 Graph 凭证可用时启用）。
- `channels.msteams.authType`：身份验证类型 —— `"secret"`（默认）或 `"federated"`。
- `channels.msteams.certificatePath`：PEM 证书文件路径（联合身份验证 + 证书身份验证）。
- `channels.msteams.certificateThumbprint`：证书指纹（可选，身份验证不要求）。
- `channels.msteams.useManagedIdentity`：启用托管身份验证（联合模式）。
- `channels.msteams.managedIdentityClientId`：用户分配托管身份的客户端 ID。
- `channels.msteams.sharePointSiteId`：用于群组聊天/渠道文件上传的 SharePoint 站点 ID（参见[在群组聊天中发送文件](#sending-files-in-group-chats)）。

## 路由与会话

- 会话键遵循标准智能体格式（参见 [/concepts/session](/zh-CN/concepts/session)）：
  - 私信共享主会话（`agent:<agentId>:<mainKey>`）。
  - 渠道/群组消息使用会话 ID：
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 回复样式：线程与帖子

Teams 最近在相同的底层数据模型之上引入了两种渠道 UI 样式：

| Style                    | Description                                               | Recommended `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts** (classic)      | 消息显示为卡片，下方附带线程回复 | `thread`（默认） |
| **Threads** (Slack-like) | 消息线性流动，更像 Slack | `top-level` |

**问题在于：** Teams API 不会暴露渠道使用的是哪种 UI 样式。如果你使用了错误的 `replyStyle`：

- 在 Threads 风格的渠道中使用 `thread` → 回复会以不自然的嵌套方式显示
- 在 Posts 风格的渠道中使用 `top-level` → 回复会显示为单独的顶级帖子，而不是在线程中

**解决方案：** 根据渠道的实际设置，按渠道配置 `replyStyle`：

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
- **渠道/群组：** 附件存储在 M365 存储中（SharePoint/OneDrive）。webhook 负载只包含 HTML 占位内容，不包含实际文件字节。**下载渠道附件需要 Graph API 权限**。
- 对于显式的文件优先发送，请使用 `action=upload-file`，并配合 `media` / `filePath` / `path`；可选的 `message` 会作为附带文本/评论，`filename` 会覆盖上传文件名。

如果没有 Graph 权限，带图片的渠道消息将仅以文本形式接收（机器人无法访问图片内容）。
默认情况下，OpenClaw 仅从 Microsoft/Teams 主机名下载媒体。可通过 `channels.msteams.mediaAllowHosts` 覆盖（使用 `["*"]` 可允许任意主机）。
Authorization 头仅会附加到 `channels.msteams.mediaAuthAllowHosts` 中的主机（默认是 Graph + Bot Framework 主机）。请保持此列表严格受限（避免使用多租户后缀）。

## 在群组聊天中发送文件

机器人可以在私信中使用 FileConsentCard 流程发送文件（内置支持）。但是，**在群组聊天/渠道中发送文件**需要额外设置：

| Context                  | How files are sent                           | Setup needed                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DMs**                  | FileConsentCard → 用户接受 → 机器人上传 | 开箱即用 |
| **Group chats/channels** | 上传到 SharePoint → 分享链接 | 需要 `sharePointSiteId` + Graph 权限 |
| **Images (any context)** | Base64 编码内联 | 开箱即用 |

### 为什么群组聊天需要 SharePoint

机器人没有个人 OneDrive 驱动器（`/me/drive` Graph API 端点不适用于应用程序身份）。要在群组聊天/渠道中发送文件，机器人需要上传到 **SharePoint 站点** 并创建共享链接。

### 设置

1. 在 Entra ID（Azure AD）→ 应用注册中**添加 Graph API 权限**：
   - `Sites.ReadWrite.All`（Application）- 上传文件到 SharePoint
   - `Chat.Read.All`（Application）- 可选，启用按用户共享链接

2. 为租户**授予管理员同意**。

3. **获取你的 SharePoint 站点 ID：**

   ```bash
   # 通过 Graph Explorer，或使用有效令牌配合 curl：
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

| Permission                              | Sharing behavior                                          |
| --------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` only              | 组织范围共享链接（组织内任何人都可访问） |
| `Sites.ReadWrite.All` + `Chat.Read.All` | 按用户共享链接（仅聊天成员可访问） |

按用户共享更安全，因为只有聊天参与者可以访问文件。如果缺少 `Chat.Read.All` 权限，机器人会回退到组织范围共享。

### 回退行为

| Scenario                                          | Result                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| 群组聊天 + 文件 + 已配置 `sharePointSiteId` | 上传到 SharePoint，发送共享链接 |
| 群组聊天 + 文件 + 未配置 `sharePointSiteId` | 尝试上传到 OneDrive（可能失败），仅发送文本 |
| 个人聊天 + 文件 | FileConsentCard 流程（无需 SharePoint 即可工作） |
| 任意上下文 + 图片 | Base64 编码内联（无需 SharePoint 即可工作） |

### 文件存储位置

上传的文件存储在已配置 SharePoint 站点默认文档库中的 `/OpenClawShared/` 文件夹内。

## 投票（Adaptive Cards）

OpenClaw 通过 Adaptive Cards 发送 Teams 投票（Teams 没有原生投票 API）。

- CLI：`openclaw message poll --channel msteams --target conversation:<id> ...`
- 投票由 Gateway 网关 记录到 `~/.openclaw/msteams-polls.json` 中。
- Gateway 网关 必须保持在线才能记录投票。
- 投票目前不会自动发布结果摘要（如有需要，请检查存储文件）。

## 展示卡片

使用 `message` 工具或 CLI 将语义化展示负载发送给 Teams 用户或会话。OpenClaw 会根据通用展示契约将其渲染为 Teams Adaptive Cards。

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

有关目标格式的详细信息，请参见下方[目标格式](#target-formats)。

## 目标格式

MSTeams 目标使用前缀来区分用户和会话：

| Target type         | Format                           | Example                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| 用户（按 ID） | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| 用户（按名称） | `user:<display-name>`            | `user:John Smith`（需要 Graph API） |
| 群组/渠道 | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| 群组/渠道（原始） | `<conversation-id>`              | `19:abc123...@thread.tacv2`（如果包含 `@thread`） |

**CLI 示例：**

```bash
# 按 ID 发送给用户
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# 按显示名称发送给用户（会触发 Graph API 查询）
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# 发送到群组聊天或渠道
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

<Note>
如果没有 `user:` 前缀，名称默认会按群组或团队解析。按显示名称指定个人时，请始终使用 `user:`。
</Note>

## 主动消息

- 只有在用户已经发生过交互之后，才能发送**主动消息**，因为我们会在那时存储会话引用。
- 有关 `dmPolicy` 和 allowlist 限制，请参见 `/gateway/configuration`。

## 团队和渠道 ID（常见陷阱）

Teams URL 中的 `groupId` 查询参数**不是**用于配置的团队 ID。请改为从 URL 路径中提取 ID：

**团队 URL：**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    团队 ID（对其进行 URL 解码）
```

**渠道 URL：**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      渠道 ID（对其进行 URL 解码）
```

**用于配置：**

- 团队 ID = `/team/` 之后的路径片段（URL 解码后，例如 `19:Bk4j...@thread.tacv2`）
- 渠道 ID = `/channel/` 之后的路径片段（URL 解码后）
- **忽略** `groupId` 查询参数

## 私有渠道

机器人在私有渠道中的支持有限：

| Feature                      | Standard Channels | Private Channels       |
| ---------------------------- | ----------------- | ---------------------- |
| 机器人安装 | 是 | 有限 |
| 实时消息（webhook） | 是 | 可能无法工作 |
| RSC 权限 | 是 | 行为可能不同 |
| @mentions                    | 是 | 如果机器人可访问 |
| Graph API 历史记录 | 是 | 是（需要权限） |

**如果私有渠道无法工作，可使用以下变通方案：**

1. 使用标准渠道进行机器人交互
2. 使用私信 —— 用户始终可以直接向机器人发送消息
3. 使用 Graph API 获取历史访问（需要 `ChannelMessage.Read.All`）

## 故障排除

### 常见问题

- **渠道中不显示图片：** 缺少 Graph 权限或管理员同意。请重新安装 Teams 应用，并完全退出/重新打开 Teams。
- **渠道中没有响应：** 默认要求提及；请设置 `channels.msteams.requireMention=false` 或按团队/渠道配置。
- **版本不匹配（Teams 仍显示旧清单）：** 删除并重新添加应用，然后完全退出 Teams 以刷新。
- **webhook 返回 401 Unauthorized：** 在没有 Azure JWT 的情况下手动测试时，这是预期行为 —— 表示端点可访问，但身份验证失败。请使用 Azure Web Chat 正确测试。

### 清单上传错误

- **“Icon file cannot be empty”：** 清单引用的图标文件大小为 0 字节。请创建有效的 PNG 图标（`outline.png` 为 32x32，`color.png` 为 192x192）。
- **“webApplicationInfo.Id already in use”：** 该应用仍安装在另一个团队/聊天中。请先找到并卸载它，或等待 5–10 分钟让变更传播。
- **上传时提示 “Something went wrong”：** 改为通过 [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) 上传，打开浏览器 DevTools（F12）→ Network 标签页，并检查响应体中的实际错误信息。
- **旁加载失败：** 尝试使用 “Upload an app to your org's app catalog” 而不是 “Upload a custom app” —— 这通常可以绕过旁加载限制。

### RSC 权限不生效

1. 验证 `webApplicationInfo.id` 是否与你机器人的 App ID 完全一致
2. 重新上传应用，并在团队/聊天中重新安装
3. 检查你的组织管理员是否屏蔽了 RSC 权限
4. 确认你使用了正确的作用域：团队使用 `ChannelMessage.Read.Group`，群组聊天使用 `ChatMessage.Read.Chat`

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
- [Pairing](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [Groups](/zh-CN/channels/groups) — 群组聊天行为和提及限制
- [Channel Routing](/zh-CN/channels/channel-routing) — 消息的会话路由
- [Security](/zh-CN/gateway/security) — 访问模型与加固
