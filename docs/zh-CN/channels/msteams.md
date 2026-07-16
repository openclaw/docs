---
read_when:
    - 处理 Microsoft Teams 渠道功能
summary: Microsoft Teams Bot 支持状态、能力和配置
title: Microsoft Teams
x-i18n:
    generated_at: "2026-07-16T11:21:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cb16cf89ed2ab7ae69389ac30e9cc32cc7d1bc2d3c6bccbd139d367380b7b32c
    source_path: channels/msteams.md
    workflow: 16
---

状态：支持文本和私信附件；在频道/群组中发送文件需要 `sharePointSiteId` + Graph 权限（参见[在群聊中发送文件](#sending-files-in-group-chats)）。投票通过 Adaptive Cards 发送。消息操作提供显式的 `upload-file`，用于优先发送文件。

## 内置插件

当前 OpenClaw 版本将 Microsoft Teams 作为内置插件提供；在常规打包版本中无需单独安装。

对于不含内置 Teams 的旧版本或自定义安装，请直接安装 npm 包：

```bash
openclaw plugins install @openclaw/msteams
```

使用不带版本号的软件包可跟随当前官方发布标签。仅在需要可复现安装时固定确切版本。

本地检出（从 git 仓库运行）：

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

详情：[插件](/zh-CN/tools/plugin)

## 快速设置

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) 可通过一条命令完成 Bot 注册、清单创建和凭据生成。

**1. 安装并登录**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # 验证你已登录并查看你的租户信息
```

<Note>
Teams CLI 目前处于预览阶段。命令和标志可能会随版本变化。
</Note>

**2. 启动隧道**（Teams 无法访问 localhost）

如有需要，请安装 devtunnel CLI 并完成身份验证（[入门指南](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)）。

```bash
# 一次性设置（跨会话保持 URL 不变）：
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# 每个开发会话：
devtunnel host my-openclaw-bot
# 你的端点：https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
由于 Teams 无法通过 devtunnels 进行身份验证，因此需要 `--allow-anonymous`。每个传入的 Bot 请求仍会由 Teams SDK 验证。
</Note>

替代方案：`ngrok http 3978` 或 `tailscale funnel 3978`（URL 可能在每个会话中发生变化）。

**3. 创建应用**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

这会创建一个 Entra ID（Azure AD）应用程序、生成客户端密钥、构建并上传 Teams 应用清单（包含图标），并注册一个由 Teams 管理的 Bot（无需 Azure 订阅）。输出中包含 `CLIENT_ID`、`CLIENT_SECRET`、`TENANT_ID` 和一个 **Teams App ID**；此外还会提供直接在 Teams 中安装该应用的选项。

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

或者直接使用环境变量：`MSTEAMS_APP_ID`、`MSTEAMS_APP_PASSWORD`、`MSTEAMS_TENANT_ID`。

**5. 在 Teams 中安装应用**

`teams app create` 会提示你安装应用；选择 "Install in Teams"。若要稍后获取安装链接：

```bash
teams app get <teamsAppId> --install-link
```

**6. 验证一切正常运行**

```bash
teams app doctor <teamsAppId>
```

对 Bot 注册、AAD 应用配置、清单有效性和 SSO 设置运行诊断。

对于生产环境，建议使用[联合身份验证](#federated-authentication-certificate-plus-managed-identity)（证书或托管标识），而不是客户端密钥。

<Note>
默认情况下，群聊会被阻止（`channels.msteams.groupPolicy: "allowlist"`）。要允许群组回复，请设置 `channels.msteams.groupAllowFrom`，或使用 `groupPolicy: "open"` 允许任何成员（仍需提及）。
</Note>

## 目标

- 通过 Teams 私信、群聊或频道与 OpenClaw 对话。
- 保持路由确定性：回复始终返回到消息到达时所在的频道。
- 默认采用安全的频道行为（除非另有配置，否则必须提及）。

## 配置写入

默认情况下，Microsoft Teams 可以写入由 `/config set|unset` 触发的配置更新（需要 `commands.config: true`）。

禁用方式：

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## 访问控制（私信 + 群组）

**私信访问**

- 默认值：`channels.msteams.dmPolicy = "pairing"`。未知发送者在获得批准之前会被忽略。
- `channels.msteams.allowFrom` 应使用稳定的 AAD 对象 ID，或 `accessGroup:core-team` 等静态发送者访问组。
- 请勿依赖 UPN/显示名称匹配来设置允许列表；这些值可能会变化。OpenClaw 默认禁用直接名称匹配；可通过 `channels.msteams.dangerouslyAllowNameMatching: true` 启用。
- 如果凭据允许，向导可通过 Microsoft Graph 将名称解析为 ID。

**群组访问**

- 默认值：`channels.msteams.groupPolicy = "allowlist"`（除非添加 `groupAllowFrom`，否则会被阻止）。未设置 `channels.msteams.groupPolicy` 时，`channels.defaults.groupPolicy` 可以覆盖共享默认值。
- `channels.msteams.groupAllowFrom` 控制哪些发送者或静态发送者访问组可以在群聊/频道中触发操作（回退到 `channels.msteams.allowFrom`）。
- 设置 `groupPolicy: "open"` 可允许任何成员（默认仍需提及）。
- 要阻止**所有**频道，请设置 `channels.msteams.groupPolicy: "disabled"`。

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

**团队 + 频道允许列表**

- 通过在 `channels.msteams.teams` 下列出团队和频道，限定群组/频道回复的范围。
- 使用 Teams 链接中的稳定 Teams 会话 ID 作为键，而不是可变的显示名称（参见[团队和频道 ID](#team-and-channel-ids-common-gotcha)）。
- 当 `groupPolicy="allowlist"` 且存在团队允许列表时，仅接受列出的团队/频道（需要提及）。
- 配置向导接受 `Team/Channel` 条目并为你存储这些条目。
- 启动时，OpenClaw 会将团队/频道和用户允许列表中的名称解析为 ID（如果 Graph 权限允许），并记录映射。无法解析的名称会按输入内容保留，但不会用于路由，除非设置了 `channels.msteams.dangerouslyAllowNameMatching: true`。

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

1. 确保 Microsoft Teams 插件可用（当前版本中已内置）。
2. 创建一个 **Azure Bot**（应用 ID + 密钥 + 租户 ID）。
3. 构建一个引用该 Bot 的 **Teams 应用包**，其中包括下述 RSC 权限。
4. 将 Teams 应用上传/安装到团队中（或安装到用于私信的个人范围）。
5. 在 `~/.openclaw/openclaw.json` 中配置 `msteams`（或使用环境变量），然后启动 Gateway 网关。
6. Gateway 网关默认在 `/api/messages` 上侦听 Bot Framework webhook 流量。

### 第 1 步：创建 Azure Bot

1. 前往[创建 Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. 填写 **Basics** 选项卡：

   | 字段               | 值                                                       |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | 你的 Bot 名称，例如 `openclaw-msteams`（必须唯一）       |
   | **Subscription**   | 选择你的 Azure 订阅                                      |
   | **Resource group** | 新建或使用现有资源组                                     |
   | **Pricing tier**   | 开发/测试选择 **Free**                                   |
   | **Type of App**    | **Single Tenant**（推荐；参见下方说明）                  |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
2025-07-31 之后，创建新的多租户 Bot 已被弃用。新 Bot 请使用 **Single Tenant**。
</Warning>

3. 点击 **Review + create**，然后点击 **Create**（约 1-2 分钟）。

### 第 2 步：获取凭据

1. Azure Bot 资源 → **Configuration** → 复制 **Microsoft App ID**（即你的 `appId`）。
2. **Manage Password** → App Registration → **Certificates & secrets** → **New client secret** → 复制 **Value**（即你的 `appPassword`）。
3. **Overview** → 复制 **Directory (tenant) ID**（即你的 `tenantId`）。

### 第 3 步：配置消息端点

1. Azure Bot → **Configuration**。
2. 设置 **Messaging endpoint**：
   - 生产环境：`https://your-domain.com/api/messages`
   - 本地开发：使用隧道（参见[本地开发](#local-development-tunneling)）

### 第 4 步：启用 Teams 频道

1. Azure Bot → **Channels**。
2. 点击 **Microsoft Teams** → Configure → Save。
3. 接受服务条款。

### 第 5 步：构建 Teams 应用清单

- 包含一个 `bot` 条目，并设置 `botId = <App ID>`。
- 范围：`personal`、`team`、`groupChat`。
- `supportsFiles: true`（处理个人范围文件时必需）。
- 添加 RSC 权限（参见 [RSC 权限](#current-teams-rsc-permissions-manifest)）。
- 创建图标：`outline.png`（32x32）和 `color.png`（192x192）。
- 将 `manifest.json`、`outline.png` 和 `color.png` 一起打包为 zip 文件。

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

当插件可用且 `msteams` 配置包含凭据时，Teams 频道会自动启动。

</details>

## 联合身份验证（证书 + 托管标识）

对于生产环境，OpenClaw 通过 `channels.msteams.authType: "federated"` 支持**联合身份验证**，作为客户端密钥的替代方案。提供两种方法：

### 选项 A：基于证书的身份验证

使用已在 Entra ID 应用注册中登记的 PEM 证书。

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

### 选项 B：Azure 托管标识

在 Azure 基础设施（AKS、App Service、Azure VM）上使用 Azure 托管标识进行无密码身份验证。

**工作原理：**

1. Bot Pod/VM 具有托管标识（系统分配或用户分配）。
2. 联合标识凭据将托管标识关联到 Entra ID 应用注册。
3. 运行时，OpenClaw 使用 `@azure/identity` 从 Azure IMDS 端点获取令牌。
4. 令牌会传递给 Teams SDK，用于 Bot 身份验证。

**前提条件：**

- 已启用托管标识的 Azure 基础设施（AKS 工作负载标识、App Service、VM）。
- 已在 Entra ID 应用注册中创建联合标识凭据。
- Pod/VM 可通过网络访问 IMDS（`169.254.169.254:80`）。

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

**配置（用户分配的托管标识）：**在上述块中添加 `managedIdentityClientId: "<MI_CLIENT_ID>"`。

**环境变量：**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>`（仅限用户分配）

### AKS 工作负载标识设置

对于使用工作负载标识的 AKS 部署：

1. 在 AKS 集群上**启用工作负载标识**。
2. 在 Entra ID 应用注册中**创建联合标识凭据**：

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

4. 为工作负载标识注入**标记 Pod**：

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **允许网络访问** IMDS（`169.254.169.254`）：如果使用 NetworkPolicy，请为端口 80 上的 `169.254.169.254/32` 添加出站规则。

### 身份验证类型对比

| 方法                 | 配置                                           | 优点                           | 缺点                               |
| -------------------- | ---------------------------------------------- | ------------------------------ | ---------------------------------- |
| **客户端密钥**       | `appPassword`                                  | 设置简单                       | 需要轮换密钥，安全性较低           |
| **证书**             | `authType: "federated"` + `certificatePath`    | 不通过网络传输共享密钥         | 证书管理开销                       |
| **托管标识**         | `authType: "federated"` + `useManagedIdentity` | 无密码，无需管理密钥           | 需要 Azure 基础设施                |

`certificateThumbprint` 可以与 `certificatePath` 一起设置，但当前身份验证路径不会读取它；接受此项仅用于向前兼容。

**默认值：**未设置 `authType` 时，OpenClaw 使用客户端密钥身份验证（`appPassword`）。现有配置无需更改即可继续工作。

## 本地开发（隧道）

Teams 无法访问 `localhost`。请使用持久开发隧道，使 URL 在不同会话中保持稳定：

```bash
# 一次性设置：
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# 每次开发会话：
devtunnel host my-openclaw-bot
```

替代方案：`ngrok http 3978` 或 `tailscale funnel 3978`（URL 可能在每次会话中发生变化）。

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
2. 在 Teams 中找到 Bot 并发送私信。
3. 检查 Gateway 网关日志中是否有传入活动。

## 环境变量

这些与身份验证相关的配置键可以通过环境变量设置，而不必在 `openclaw.json` 中设置（其他配置键，例如 `groupPolicy` 或 `historyLimit`，只能通过配置设置）：

| 环境变量                             | 配置键                    | 说明                                |
| ------------------------------------ | ------------------------- | ----------------------------------- |
| `MSTEAMS_APP_ID`                     | `appId`                   |                                     |
| `MSTEAMS_APP_PASSWORD`               | `appPassword`             |                                     |
| `MSTEAMS_TENANT_ID`                  | `tenantId`                |                                     |
| `MSTEAMS_AUTH_TYPE`                  | `authType`                | `"secret"` 或 `"federated"`         |
| `MSTEAMS_CERTIFICATE_PATH`           | `certificatePath`         | 联合身份验证 + 证书                 |
| `MSTEAMS_CERTIFICATE_THUMBPRINT`     | `certificateThumbprint`   | 接受此项，但身份验证不需要          |
| `MSTEAMS_USE_MANAGED_IDENTITY`       | `useManagedIdentity`      | 联合身份验证 + 托管标识             |
| `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` | `managedIdentityClientId` | 仅限用户分配的托管标识              |

## 成员信息操作

OpenClaw 为 Microsoft Teams 提供基于 Graph 的 `member-info` 操作，使智能体和自动化能够解析已配置会话中经过验证的成员名单详细信息。

要求：

- `ChannelSettings.Read.Group` 和 `TeamMember.Read.Group` RSC 权限（推荐清单中已包含）。

只要配置了 Graph 凭据，该操作就可用；没有单独的 `channels.msteams.actions.memberInfo` 开关。
标准频道查询会返回匹配的团队成员名单标识、显示名称、电子邮件和角色。
在当前私信或群聊中，该操作可以返回可信发送者的稳定用户 ID。
私有/共享频道和非当前聊天的成员查询需要额外的成员名单权限，
默认权限基线会拒绝此类查询。

## 历史上下文

- `channels.msteams.historyLimit` 控制将多少条最近的频道/群组消息封装到提示词中。若未设置，则回退到 `messages.groupChat.historyLimit`，然后默认为 50。设置 `0` 可禁用。
- 获取的线程历史记录会按发送者允许列表（`allowFrom` / `groupAllowFrom`）进行筛选，因此线程上下文植入仅包含来自允许发送者的消息。
- 引用的附件上下文（从回复自身附件中的 Skype Reply-schema HTML 解析）会不经筛选直接传递；目前只有线程历史记录植入会应用发送者允许列表筛选器。
- 可以使用 `channels.msteams.dmHistoryLimit`（用户轮次）限制私信历史记录。每用户覆盖项：`channels.msteams.dms["<user_id>"].historyLimit`。

## 当前 Teams RSC 权限（清单）

这些是 Teams 应用清单中**现有的 resourceSpecific 权限**。它们仅适用于安装了该应用的团队/聊天。

**对于频道（团队范围）：**

- `ChannelMessage.Read.Group` (Application) - 无需 @提及即可接收所有频道消息
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**对于群聊：**

- `ChatMessage.Read.Chat` (Application) - 无需 @提及即可接收所有群聊消息

通过 Teams CLI 添加 RSC 权限：

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Teams 清单示例（已隐去敏感信息）

包含必填字段的最小有效示例。请替换 ID 和 URL。

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "你的组织",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "Teams 中的 OpenClaw", full: "Teams 中的 OpenClaw" },
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
- `bots[].scopes` 必须包含计划使用的界面（`personal`、`team`、`groupChat`）。
- 在个人范围内处理文件需要 `bots[].supportsFiles: true`。
- `authorization.permissions.resourceSpecific` 必须包含用于频道流量的频道读取/发送权限。

### 更新现有应用

```bash
# 下载、编辑并重新上传清单
teams app manifest download <teamsAppId> manifest.json
# 在本地编辑 manifest.json...
teams app manifest upload manifest.json <teamsAppId>
# 如果内容发生变化，版本会自动递增
```

更新后，请在每个团队中重新安装该应用，并**完全退出并重新启动 Teams**（而不只是关闭窗口），以清除缓存的应用元数据。

<details>
<summary>手动更新清单（不使用 CLI）</summary>

1. 使用新设置更新 `manifest.json`。
2. **递增 `version` 字段**（例如 `1.0.0` → `1.1.0`）。
3. 将清单与图标（`manifest.json`、`outline.png`、`color.png`）**重新压缩为 zip 文件**。
4. 上传新的 zip 文件：
   - **Teams Admin Center：** Teams apps → Manage apps → 找到你的应用 → Upload new version。
   - **旁加载：** Teams → Apps → Manage your apps → Upload a custom app。

</details>

## 能力：仅 RSC 与 Graph 对比

### 仅使用 **Teams RSC**（已安装应用，无 Graph API 权限）

可用：

- 读取频道消息的**文本**内容。
- 发送频道消息的**文本**内容。
- 接收**个人（私信）**文件附件。

不可用：

- 频道/群组中的**图像或文件内容**（有效负载仅包含 HTML 占位内容）。
- 下载存储在 SharePoint/OneDrive 中的附件。
- 读取实时 Webhook 事件以外的消息历史记录。

### 使用 **Teams RSC + Microsoft Graph 应用程序权限**

新增：

- 下载托管内容（粘贴到消息中的图像）。
- 下载存储在 SharePoint/OneDrive 中的文件附件。
- 通过 Graph 读取频道/聊天消息历史记录。

### RSC 与 Graph API 对比

| 能力                    | RSC 权限              | Graph API                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **实时消息**            | 是（通过 webhook）    | 否（仅轮询）                        |
| **历史消息**            | 否                    | 是（可查询历史记录）                |
| **设置复杂度**          | 仅需应用清单          | 需要管理员同意 + 令牌流程           |
| **支持离线使用**        | 否（必须保持运行）    | 是（可随时查询）                    |

**结论：** RSC 用于实时监听；Graph API 用于访问历史记录。若要在离线后补取错过的消息，需要使用具有 `ChannelMessage.Read.All` 的 Graph API（需要管理员同意）。

## 由 Graph 支持的媒体 + 历史记录

仅启用你所使用的 Teams 范围和数据所需的 Microsoft Graph 应用程序权限：

1. Entra ID (Azure AD) **App Registration** → 添加 Graph **Application permissions**：
   - `ChannelMessage.Read.All`，用于频道附件和频道历史记录。
   - `Chat.Read.All`，用于群聊附件和群聊历史记录。
   - 当必须从 SharePoint/OneDrive 存储下载附件字节时，使用 `Files.Read.All`；仅使用历史记录的设置不需要此权限。
2. 为租户执行 **Grant admin consent**。
3. 递增 Teams 应用的**清单版本**，重新上传，并**在 Teams 中重新安装应用**。
4. **完全退出并重新启动 Teams**，以清除缓存的应用元数据。

### 频道/群组文件恢复（`graphMediaFallback`）

Teams 可能会从发送给机器人的 HTML 活动中移除文件标记。在这种情况下，Bot Framework 活动与普通 HTML 消息无法区分；完整的附件引用仅存在于该消息的 Graph 副本中。

授予上述权限后，启用回退：

```json5
{
  channels: {
    msteams: {
      graphMediaFallback: true,
    },
  },
}
```

此设置仅适用于频道和群聊。每当 HTML 活动未生成可直接下载的媒体时，它都会额外执行一次 Graph 消息查询，包括普通消息或仅含提及的消息。默认值为 `false`，因此现有安装不会自动增加 Graph 流量或出现权限错误。

**用户提及：** 对于已在对话中的用户，@提及无需配置即可使用。若要动态搜索并提及**不在当前对话中的**用户，请添加 `User.Read.All`（Application）权限并授予管理员同意。

## 已知限制

### Webhook 超时

Teams 通过 HTTP webhook 传递消息。OpenClaw 对该 webhook 监听器应用固定的 HTTP 服务器超时：非活动超时 30 秒、请求总超时 30 秒、接收请求头超时 15 秒。可选的入站媒体和上下文增强共享 10 秒预算，但 Teams SDK 在返回 webhook 响应前仍会等待智能体轮次完成。如果完整轮次超过 Teams 的重试窗口，可能会出现：

- Teams 重试消息（导致重复）。
- 回复丢失。

智能体响应后，系统会主动发送回复，但运行缓慢的智能体仍可能导致 Teams 端出现重试或重复消息。

### Teams 云和服务 URL 支持

这个基于 SDK 的 Teams 路径已针对 Microsoft Teams 公有云完成实时验证。

入站回复使用传入的 Teams SDK 轮次上下文。脱离上下文的主动操作（发送、编辑、删除、卡片、投票、文件同意消息和排队的长时间运行回复）使用存储的对话引用 `serviceUrl`。公有云默认使用 Teams SDK 的公有云环境，并允许使用公有 Teams Connector 主机上的存储引用：`https://smba.trafficmanager.net/`。

默认使用公有云。对于普通公有云机器人，无需设置 `channels.msteams.cloud` 或 `channels.msteams.serviceUrl`。

对于非公有 Teams 云，请设置 `cloud`，并在 Microsoft 发布匹配的主动操作边界时进行相应设置：

- `channels.msteams.cloud` 选择用于身份验证、JWT 验证、令牌服务和 Graph 范围的 Teams SDK 云预设。
- `channels.msteams.serviceUrl` 选择 Bot Connector 端点边界，用于在主动发送、编辑、删除、卡片、投票、文件同意消息和排队的长时间运行回复前验证存储的对话引用。USGov 和 DoD SDK 云必须设置此项。对于中国/世纪互联，OpenClaw 使用 SDK 的 `China` 预设，并且仅接受 Azure 中国 Bot Framework 渠道主机上的存储/配置服务 URL。

Microsoft 在 Teams 主动消息文档的[创建对话](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation)部分发布了全局主动 Bot Connector 端点。有传入活动的 `serviceUrl` 时请使用它；否则使用下方的 Microsoft 表格。

| Teams 环境       | OpenClaw 配置                                               | 主动操作 `serviceUrl`                         |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| 公有云            | 无需云/serviceUrl 配置                                      | `https://smba.trafficmanager.net/teams`                                 |
| GCC               | 设置 `serviceUrl`；不存在单独的 Teams SDK 云预设     | `https://smba.infra.gcc.teams.microsoft.com/teams`                                 |
| GCC High          | `cloud: "USGov"` + `serviceUrl`                    | `https://smba.infra.gov.teams.microsoft.us/teams`                                 |
| DoD               | `cloud: "USGovDoD"` + `serviceUrl`                    | `https://smba.infra.dod.teams.microsoft.us/teams`                                 |
| 中国/世纪互联     | `cloud: "China"`                                         | 使用传入活动的 `serviceUrl`                  |

以下是 GCC 的示例，其中 Microsoft 记录了单独的主动操作服务 URL，但 Teams SDK 未提供单独的 GCC 云预设：

```json
{
  "channels": {
    "msteams": {
      "serviceUrl": "https://smba.infra.gcc.teams.microsoft.com/teams"
    }
  }
}
```

以下是 GCC High 的示例：

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

`channels.msteams.serviceUrl` 仅限受支持的 Microsoft Teams Bot Connector 主机。配置服务 URL 后，OpenClaw 会先检查存储对话的 `serviceUrl` 是否使用相同主机，然后才执行主动发送、编辑、删除、卡片、投票或排队的长时间运行回复。使用默认公有云配置时，如果存储的对话指向公有 Teams Connector 主机以外的位置，OpenClaw 会执行故障关闭。更改云/服务 URL 设置后，请从该对话接收一条新消息，以确保所存储的对话引用为最新状态。

Microsoft 的 Teams 主动端点表中没有为中国/世纪互联提供单独的全局主动 `smba` URL。请配置 `cloud: "China"`，以便 Teams SDK 使用 Azure 中国的身份验证、令牌和 JWT 端点。之后，主动发送需要来自传入中国 Teams 活动的已存储对话引用，或位于 Azure 中国 Bot Framework 渠道边界（`*.botframework.azure.cn`）上的显式配置服务 URL。在 OpenClaw 通过 Azure 中国 Graph 端点路由 Graph 请求之前，`cloud: "China"` 的 Graph 支持型 Teams 辅助功能处于禁用状态。

### 格式设置

Teams 的 Markdown 功能比 Slack 或 Discord 更受限：

- 支持基本格式：**粗体**、_斜体_、`code`、链接。
- 复杂 Markdown（表格、嵌套列表）可能无法正确呈现。
- 投票和语义呈现发送支持 Adaptive Cards（见下文）。

## 配置

关键设置（共享渠道模式请参阅 [/gateway/configuration](/zh-CN/gateway/configuration)）：

- `channels.msteams.enabled`：启用/禁用该渠道。
- `channels.msteams.appId`、`channels.msteams.appPassword`、`channels.msteams.tenantId`：Bot 凭据。
- `channels.msteams.cloud`：Teams SDK 云环境（`Public`、`USGov`、`USGovDoD` 或 `China`；默认值为 `Public`）。对于 USGov/DoD SDK 云，请使用 `serviceUrl` 进行设置；中国区使用 SDK 预设和存储的 Azure 中国区 Bot Framework 会话引用，在 Azure 中国区 Graph 路由发布前，基于 Graph 的辅助功能处于禁用状态。
- `channels.msteams.serviceUrl`：用于 SDK 主动操作的 Bot Connector 服务 URL 边界。公有云使用 SDK 默认值；对于 GCC（`https://smba.infra.gcc.teams.microsoft.com/teams`）、GCC High 或 DoD，请设置此项。当存储的会话引用来自由世纪互联运营的 Teams 时，中国区支持 Azure 中国区 Bot Framework 渠道主机。
- `channels.msteams.webhook.port`（默认值为 `3978`）。
- `channels.msteams.webhook.path`（默认值为 `/api/messages`）。
- `channels.msteams.dmPolicy`：`pairing | allowlist | open | disabled`（默认值为 `pairing`）。
- `channels.msteams.allowFrom`：私信允许列表（建议使用 AAD 对象 ID）。如果 Graph 访问可用，向导会在设置期间将名称解析为 ID。
- `channels.msteams.dangerouslyAllowNameMatching`：紧急切换开关，用于重新启用可变的 UPN/显示名称匹配以及按团队/渠道名称直接路由。
- `channels.msteams.textChunkLimit`：出站文本的字符分块大小（默认值为 `4000`；无论配置的值多高，硬性上限均为 `4000`）。
- `channels.msteams.streaming.chunkMode`：`length`（默认）或 `newline`，用于在按长度分块前先按空行（段落边界）拆分。
- `channels.msteams.mediaAllowHosts`：入站附件主机允许列表（默认为 Microsoft/Teams 域：Graph、SharePoint/OneDrive、Teams CDN、Bot Framework、Azure Media Services）。
- `channels.msteams.mediaAuthAllowHosts`：媒体重试时可附加 Authorization 标头的主机允许列表（默认为 Graph + Bot Framework 主机）。
- `channels.msteams.graphMediaFallback`：当渠道/群组 HTML 省略文件标记时，选择启用 Graph 消息查询（默认值为 `false`；参见[渠道/群组文件恢复](#channelgroup-file-recovery-graphmediafallback)）。
- `channels.msteams.mediaMaxMb`：每个渠道的媒体大小限制覆盖值，单位为 MB。未设置时回退到 `agents.defaults.mediaMaxMb`。
- `channels.msteams.requireMention`：在渠道/群组中要求使用 @提及（默认值为 `true`）。
- `channels.msteams.replyStyle`：`thread | top-level`（参见[回复样式](#reply-style-threads-vs-posts)）。
- `channels.msteams.teams.<teamId>.replyStyle`：按团队覆盖。
- `channels.msteams.teams.<teamId>.requireMention`：按团队覆盖。
- `channels.msteams.teams.<teamId>.tools`：未设置渠道覆盖时使用的默认按团队工具策略覆盖（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.toolsBySender`：默认的按团队、按发送者工具策略覆盖（支持 `"*"` 通配符）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`：按渠道覆盖。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`：按渠道覆盖。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`：按渠道工具策略覆盖（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`：按渠道、按发送者工具策略覆盖（支持 `"*"` 通配符）。
- `toolsBySender` 键应使用明确的前缀：`channel:`、`id:`、`e164:`、`username:`、`name:`（旧版无前缀键仍仅映射到 `id:`）。
- `channels.msteams.authType`：身份验证类型——`"secret"`（默认）或 `"federated"`。
- `channels.msteams.certificatePath`：PEM 证书文件的路径（联合身份验证 + 证书身份验证）。
- `channels.msteams.certificateThumbprint`：证书指纹；支持提供，但身份验证不要求此项。
- `channels.msteams.useManagedIdentity`：启用托管身份验证（联合身份验证模式）。
- `channels.msteams.managedIdentityClientId`：用户分配的托管身份的客户端 ID。
- `channels.msteams.sharePointSiteId`：用于在群聊/渠道中上传文件的 SharePoint 站点 ID（参见[在群聊中发送文件](#sending-files-in-group-chats)）。
- `channels.msteams.welcomeCard`、`channels.msteams.groupWelcomeCard`、`channels.msteams.promptStarters`：首次通过私信/群组联系时显示的欢迎 Adaptive Card，以及其中的建议提示按钮。
- `channels.msteams.responsePrefix`：添加到出站回复前的文本。
- `channels.msteams.feedbackEnabled`（默认值为 `true`）、`channels.msteams.feedbackReflection`（默认值为 `true`）、`channels.msteams.feedbackReflectionCooldownMs`：回复的赞成/反对反馈，以及负面反馈后的反思跟进。
- `channels.msteams.sso`、`channels.msteams.delegatedAuth`：用于由 SSO 支持的流程的 Bot Framework OAuth 连接和委托 Graph 权限范围；`sso.enabled: true` 要求设置 `sso.connectionName`。

## 路由和会话

- 会话键遵循标准智能体格式（参见 [/concepts/session](/zh-CN/concepts/session)）：
  - 私信共享主会话（`agent:<agentId>:<mainKey>`）。
  - 渠道/群组消息使用会话 ID：
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 回复样式：线程与帖子

Teams 在同一底层数据模型上提供两种渠道 UI 样式：

| 样式                     | 描述                                              | 建议的 `replyStyle` |
| ------------------------ | ------------------------------------------------- | ------------------------ |
| **帖子**（经典）         | 消息显示为卡片，下方包含线程式回复                | `thread`（默认） |
| **线程**（类似 Slack）   | 消息线性流动，更类似 Slack                        | `top-level`       |

**问题：**Teams API 不会公开渠道使用的是哪种 UI 样式。如果使用错误的 `replyStyle`：

- 在线程样式的渠道中使用 `thread` → 回复会以不自然的嵌套形式显示。
- 在帖子样式的渠道中使用 `top-level` → 回复会显示为独立的顶层帖子，而不是在线程中。

**解决方案：**根据渠道的设置方式，为每个渠道配置 `replyStyle`：

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

当 Bot 向渠道发送回复时，会从最具体的覆盖项向下解析 `replyStyle`，直至默认值。第一个非 `undefined` 值生效：

1. **按渠道**——`channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **按团队**——`channels.msteams.teams.<teamId>.replyStyle`
3. **全局**——`channels.msteams.replyStyle`
4. **隐式默认值**——根据 `requireMention` 推导：
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

如果全局设置了 `requireMention: false`，但未显式设置 `replyStyle`，那么帖子样式渠道中的提及会显示为顶层帖子，即使入站消息是线程回复也是如此。请在全局、团队或渠道级别固定 `replyStyle: "thread"`，以避免意外行为。

对于主动发送到已存储渠道会话的消息（排队的工具调用回复、长时间运行的智能体），会应用相同的团队/渠道解析规则；对于主动发送，无论 `replyStyle` 如何设置，群聊和个人（私信）会话始终解析为 `top-level`。

### 线程上下文保留

当 `replyStyle: "thread"` 生效，并且 Bot 是从渠道线程内部被 @提及时，OpenClaw 会将原始线程根重新附加到出站会话引用（`19:...@thread.tacv2;messageid=<root>`），使回复进入同一线程。这同时适用于实时（当前轮次中）发送，以及 Bot Framework 轮次上下文过期后进行的主动发送（例如长时间运行的智能体、通过 `mcp__openclaw__message` 排队的工具调用回复）。

线程根取自会话引用中存储的 `threadId`。早于 `threadId` 的旧版存储引用会回退到 `activityId`（即最后一次为会话提供初始数据的入站活动），因此现有部署无需重新初始化即可继续工作。

当 `replyStyle: "top-level"` 生效时，渠道线程入站消息会被有意回复为新的顶层帖子；不会附加线程后缀。对于线程样式的渠道，这是正确行为；如果原本预期得到线程式回复却出现顶层帖子，则说明该渠道的 `replyStyle` 设置有误。

## 附件和图像

**当前限制：**

- **私信：**图像和文件附件可通过 Teams Bot 文件 API 使用。
- **渠道/群组：**附件存储在 M365 存储空间（SharePoint/OneDrive）中。Webhook 负载仅包含 HTML 存根，不包含实际文件字节。下载渠道附件**需要 Graph API 权限**。
- 对于明确以文件为主的发送，请将 `action=upload-file` 与 `media` / `filePath` / `path` 配合使用；可选的 `message` 会成为随附文本/注释，`filename`（或 `title`）会覆盖上传后的名称。

如果没有 Graph 权限，包含图像的渠道消息将以纯文本形式到达（Bot 无法访问图像内容）。
默认情况下，OpenClaw 仅从 Microsoft/Teams 主机名下载媒体。可通过 `channels.msteams.mediaAllowHosts` 覆盖此设置（使用 `["*"]` 可允许任意主机）。
仅对 `channels.msteams.mediaAuthAllowHosts` 中的主机附加 Authorization 标头（默认为 Graph + Bot Framework 主机）。请严格限制此列表（避免多租户后缀）。

## 在群聊中发送文件

Bot 可以使用内置的 FileConsentCard 流程在私信中发送文件。**在群聊/渠道中发送文件**需要额外设置：

| 上下文                   | 文件发送方式                                   | 所需设置                                         |
| ------------------------ | ---------------------------------------------- | ------------------------------------------------ |
| **私信**                 | FileConsentCard → 用户接受 → Bot 上传          | 开箱即用                                         |
| **群聊/渠道**            | 上传到 SharePoint → 原生文件卡片               | 需要 `sharePointSiteId` + Graph 权限             |
| **图像（任意上下文）**   | Base64 编码的内联内容                          | 开箱即用                                         |

### 群聊为何需要 SharePoint

Bot 使用应用程序身份，而 Microsoft Graph 的 `/me` 资源[要求用户已登录](https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0)。若要在群聊/渠道中发送文件，Bot 会将文件上传到 **SharePoint 站点**并创建共享链接。

### 设置

1. 在 Entra ID (Azure AD) → App Registration 中**添加 Graph API 权限**：
   - `Sites.ReadWrite.All` (Application) - 将文件上传到 SharePoint。
   - `ChatMember.Read.All` (Application) - 群聊文件发送所需的最低权限租户级权限。启用群聊历史记录时，`Chat.Read.All` 也可使用且已涵盖此需求。作为按聊天授权的替代方案，可以使用 `ChatMember.Read.Chat` [资源特定同意权限](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)。
2. 为租户**授予管理员同意**。
3. **获取你的 SharePoint 站点 ID：**

   ```bash
   # 通过 Graph Explorer 或使用有效令牌的 curl：
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # 示例：对于位于 "contoso.sharepoint.com/sites/BotFiles" 的站点
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # 响应包含："id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **配置 OpenClaw：**

   ```json5
   {
     channels: {
       msteams: {
         // ... 其他配置 ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### 共享行为

| 上下文和权限                                                            | 共享行为                                           |
| ----------------------------------------------------------------------- | --------------------------------------------------------- |
| 频道 + `Sites.ReadWrite.All`                                         | 组织范围的共享链接（组织内任何人均可访问） |
| 群聊 + `Sites.ReadWrite.All` + 受支持的聊天成员读取授权 | 按用户提供的共享链接（仅聊天成员可访问）      |
| 群聊没有受支持的聊天成员读取授权                                        | 发送以安全关闭方式失败                                    |

按用户共享更加安全，因为只有聊天参与者可以访问文件。对于群聊，OpenClaw 要求成功查询成员；超时、传输失败、空结果和 Graph API 拒绝都会导致发送失败，而不会将访问权限扩大到整个组织。

### 回退行为

| 场景                                                             | 结果                                             |
| ---------------------------------------------------------------- | ------------------------------------------------ |
| 群聊 + 文件 + 已配置 SharePoint 和成员权限 | 上传到 SharePoint，发送原生文件卡片    |
| 群聊 + 文件 + 缺少 SharePoint 或成员权限     | 失败并显示可操作的配置错误      |
| 频道 + 文件 + 已配置 `sharePointSiteId`                   | 上传到 SharePoint，发送原生文件卡片    |
| 个人聊天 + 文件                                             | FileConsentCard 流程（无需 SharePoint 即可使用）  |
| 任意上下文 + 图片                                              | Base64 编码的内联内容（无需 SharePoint 即可使用） |

### 文件存储位置

上传的文件存储在已配置 SharePoint 站点默认文档库的 `/OpenClawShared/` 文件夹中。

## 投票（Adaptive Cards）

OpenClaw 通过 Adaptive Cards 发送 Teams 投票（Teams 没有原生投票 API）。

- CLI：`openclaw message poll --channel msteams --target conversation:<id> --poll-question "..." --poll-option "..." --poll-option "..."`。
- 投票由 Gateway 网关记录在 OpenClaw 插件状态 SQLite 的 `state/openclaw.sqlite` 下。
- 现有的 `msteams-polls.json` 文件由 `openclaw doctor --fix` 导入，而不是由运行中的插件导入。
- Gateway 网关必须保持在线才能记录投票。
- 投票不会自动发布结果摘要，目前也没有投票结果 CLI。

## 呈现卡片

使用 `message` 工具、CLI 或常规回复投递，将语义化呈现载荷发送给 Teams 用户或会话。OpenClaw 根据通用呈现契约将其渲染为 Teams Adaptive Cards。

`presentation` 参数接受语义块。提供 `presentation` 时，消息文本可选。按钮会渲染为 Adaptive Card 提交操作或 URL 操作。Teams 渲染器不原生支持选择菜单，因此 OpenClaw 会在投递前将其降级为可读文本。

**智能体工具：**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "你好",
    blocks: [{ type: "text", text: "你好！" }],
  },
}
```

**CLI：**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"你好","blocks":[{"type":"text","text":"你好！"}]}'
```

有关目标格式的详细信息，请参阅下方的[目标格式](#target-formats)。

## 目标格式

MSTeams 目标使用前缀来区分用户和会话：

| 目标类型            | 格式                             | 示例                                                                                                   |
| ------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 用户（按 ID）       | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`                                                            |
| 用户（按名称）      | `user:<display-name>`            | `user:John Smith`（需要 Graph API）                                                                 |
| 群组/频道           | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`                                                               |
| 群组/频道（原始值） | `<conversation-id>`              | `19:abc123...@thread.tacv2`、`19:...@unq.gbl.spaces` 或不带前缀的 `a:`/`8:orgid:`/`29:` Bot Framework ID |

**CLI 示例：**

```bash
# 按 ID 发送给用户
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "你好"

# 按显示名称发送给用户（触发 Graph API 查询）
openclaw message send --channel msteams --target "user:John Smith" --message "你好"

# 发送到群聊或频道
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "你好"

# 向会话发送呈现卡片
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"你好","blocks":[{"type":"text","text":"你好"}]}'
```

**智能体工具示例：**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "你好！",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "你好",
    blocks: [{ type: "text", text: "你好" }],
  },
}
```

<Note>
如果没有 `user:` 前缀，名称默认按群组或团队解析。按显示名称指定人员时，始终使用 `user:`。
</Note>

## 主动消息

- 只有在用户进行过交互**之后**才能发送主动消息，因为 OpenClaw 会在此时存储会话引用。
- 有关 `dmPolicy` 和允许列表门控，请参阅 [/gateway/configuration](/zh-CN/gateway/configuration)。

## 团队和频道 ID（常见误区）

Teams URL 中的 `groupId` 查询参数**不是**用于配置的团队 ID。请改为从 URL 路径中提取 ID：

**团队 URL：**

```text
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    团队会话 ID（对此值进行 URL 解码）
```

**频道 URL：**

```text
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      频道 ID（对此值进行 URL 解码）
```

**用于配置：**

- 团队键 = `/team/` 后的路径段（经 URL 解码，例如 `19:Bk4j...@thread.tacv2`；较旧的租户可能显示 `@thread.skype`，这也有效）。
- 频道键 = `/channel/` 后的路径段（经 URL 解码）。
- 对于 OpenClaw 路由，请**忽略** `groupId` 查询参数。它是 Microsoft Entra 群组 ID，而不是传入 Teams 活动中使用的 Bot Framework 会话 ID。

## 私有频道

Bot 对私有频道的支持有限：

| 功能                         | 标准频道 | 私有频道             |
| ---------------------------- | ----------------- | ---------------------- |
| Bot 安装                     | 是                | 有限                   |
| 实时消息（webhook）          | 是                | 可能无法工作           |
| RSC 权限                     | 是                | 行为可能有所不同       |
| @提及                        | 是                | 如果 Bot 可访问        |
| Graph API 历史记录           | 是                | 是（需要权限）         |

**如果私有频道无法工作，可采用以下变通方法：**

1. 使用标准频道与 Bot 交互。
2. 使用私信；用户始终可以直接向 Bot 发送消息。
3. 使用 Graph API 访问历史记录（需要 `ChannelMessage.Read.All`）。

## 故障排查

### 常见问题

- **频道中不显示图片：**缺少 Graph 权限或管理员同意。重新安装 Teams 应用，然后完全退出并重新打开 Teams。
- **频道中没有响应：**默认要求提及；设置 `channels.msteams.requireMention=false` 或按团队/频道进行配置。
- **版本不匹配（Teams 仍显示旧清单）：**移除并重新添加应用，然后完全退出 Teams 以刷新。
- **webhook 返回 401 Unauthorized：**在没有 Azure JWT 的情况下手动测试时，这是预期结果；这表示端点可访问，但身份验证失败。请使用 Azure Web Chat 进行正确测试。

### 清单上传错误

- **"Icon file cannot be empty"：**清单引用的图标文件大小为 0 字节。创建有效的 PNG 图标（`outline.png` 使用 32x32，`color.png` 使用 192x192）。
- **"webApplicationInfo.Id already in use"：**应用仍安装在其他团队/聊天中。请先找到并卸载它，或等待 5-10 分钟以完成传播。
- **上传时出现 "Something went wrong"：**改为通过 [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) 上传，打开浏览器 DevTools (F12) → Network 选项卡，然后检查响应正文以了解实际错误。
- **旁加载失败：**尝试使用 "Upload an app to your org's app catalog"，而不是 "Upload a custom app"；这通常可以绕过旁加载限制。

### RSC 权限无法工作

1. 验证 `webApplicationInfo.id` 是否与 Bot 的应用 ID 完全匹配。
2. 重新上传应用，并在团队/聊天中重新安装。
3. 检查组织管理员是否已阻止 RSC 权限。
4. 确认使用了正确的范围：团队使用 `ChannelMessage.Read.Group`，群聊使用 `ChatMessage.Read.Chat`。

## 参考资料

- [创建 Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot 设置指南
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - 创建/管理 Teams 应用
- [Teams 应用清单架构](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [使用 RSC 接收频道消息](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC 权限参考](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams Bot 文件处理](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4)（频道/群组需要 Graph）
- [主动消息](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - 用于管理 Bot 的 Teams CLI

## 相关内容

- [渠道概览](/zh-CN/channels) - 所有支持的渠道
- [配对](/zh-CN/channels/pairing) - 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) - 群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) - 消息的会话路由
- [安全性](/zh-CN/gateway/security) - 访问模型和安全加固
