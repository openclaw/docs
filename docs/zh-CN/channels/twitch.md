---
read_when:
    - 为 OpenClaw 设置 Twitch 聊天集成
sidebarTitle: Twitch
summary: Twitch 聊天机器人配置与设置
title: Twitch
x-i18n:
    generated_at: "2026-05-02T21:57:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0d5f16d1369e2783bec6e0c7b2d7bee8aae86f2a424b77b9adf14850de0f20b
    source_path: channels/twitch.md
    workflow: 16
---

通过 IRC 连接支持 Twitch 聊天。OpenClaw 以 Twitch 用户（机器人账号）身份连接，用于在频道中接收和发送消息。

## 内置插件

<Note>
Twitch 在当前 OpenClaw 版本中作为内置插件提供，因此普通打包构建不需要单独安装。
</Note>

如果你使用的是较旧构建，或是排除了 Twitch 的自定义安装，请直接安装 npm 包：

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="本地检出">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

使用裸包名可跟随当前官方发布标签。仅在需要可复现安装时才固定精确版本。

详情：[插件](/zh-CN/tools/plugin)

## 快速设置（初学者）

<Steps>
  <Step title="确保插件可用">
    当前打包的 OpenClaw 版本已内置该插件。较旧/自定义安装可以使用上面的命令手动添加。
  </Step>
  <Step title="创建 Twitch 机器人账号">
    为机器人创建一个专用 Twitch 账号（或使用现有账号）。
  </Step>
  <Step title="生成凭证">
    使用 [Twitch Token Generator](https://twitchtokengenerator.com/)：

    - 选择 **Bot Token**
    - 确认已选择 `chat:read` 和 `chat:write` 作用域
    - 复制 **Client ID** 和 **Access Token**

  </Step>
  <Step title="查找你的 Twitch 用户 ID">
    使用 [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) 将用户名转换为 Twitch 用户 ID。
  </Step>
  <Step title="配置令牌">
    - 环境变量：`OPENCLAW_TWITCH_ACCESS_TOKEN=...`（仅默认账号）
    - 或配置：`channels.twitch.accessToken`

    如果两者都已设置，配置优先（环境变量回退仅适用于默认账号）。

  </Step>
  <Step title="启动 Gateway 网关">
    使用已配置的渠道启动 Gateway 网关。
  </Step>
</Steps>

<Warning>
添加访问控制（`allowFrom` 或 `allowedRoles`），防止未经授权的用户触发机器人。`requireMention` 默认值为 `true`。
</Warning>

最小配置：

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Bot's Twitch account
      accessToken: "oauth:abc123...", // OAuth Access Token (or use OPENCLAW_TWITCH_ACCESS_TOKEN env var)
      clientId: "xyz789...", // Client ID from Token Generator
      channel: "vevisk", // Which Twitch channel's chat to join (required)
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only - get it from https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## 它是什么

- 一个由 Gateway 网关拥有的 Twitch 渠道。
- 确定性路由：回复始终返回 Twitch。
- 每个账号都会映射到一个隔离的会话键 `agent:<agentId>:twitch:<accountName>`。
- `username` 是机器人的账号（用于认证），`channel` 是要加入的聊天室。

## 设置（详细）

### 生成凭证

使用 [Twitch Token Generator](https://twitchtokengenerator.com/)：

- 选择 **Bot Token**
- 确认已选择 `chat:read` 和 `chat:write` 作用域
- 复制 **Client ID** 和 **Access Token**

<Note>
不需要手动注册应用。令牌会在数小时后过期。
</Note>

### 配置机器人

<Tabs>
  <Tab title="环境变量（仅默认账号）">
    ```bash
    OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
    ```
  </Tab>
  <Tab title="配置">
    ```json5
    {
      channels: {
        twitch: {
          enabled: true,
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
      },
    }
    ```
  </Tab>
</Tabs>

如果环境变量和配置都已设置，配置优先。

### 访问控制（推荐）

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only
    },
  },
}
```

优先使用 `allowFrom` 作为硬性允许列表。如果你想要基于角色的访问，请改用 `allowedRoles`。

**可用角色：** `"moderator"`、`"owner"`、`"vip"`、`"subscriber"`、`"all"`。

<Note>
**为什么使用用户 ID？** 用户名可以更改，可能导致冒充。用户 ID 是永久的。

查找你的 Twitch 用户 ID：[https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)（将你的 Twitch 用户名转换为 ID）
</Note>

## 令牌刷新（可选）

来自 [Twitch Token Generator](https://twitchtokengenerator.com/) 的令牌无法自动刷新，请在过期后重新生成。

若要自动刷新令牌，请在 [Twitch Developer Console](https://dev.twitch.tv/console) 创建你自己的 Twitch 应用，并添加到配置：

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

机器人会在过期前自动刷新令牌，并记录刷新事件。

## 多账号支持

使用 `channels.twitch.accounts` 配置每个账号的令牌。共享模式请参阅[配置](/zh-CN/gateway/configuration)。

示例（一个机器人账号加入两个频道）：

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

<Note>
每个账号都需要自己的令牌（每个频道一个令牌）。
</Note>

## 访问控制

<Tabs>
  <Tab title="用户 ID 允许列表（最安全）">
    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              allowFrom: ["123456789", "987654321"],
            },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="基于角色">
    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              allowedRoles: ["moderator", "vip"],
            },
          },
        },
      },
    }
    ```

    `allowFrom` 是硬性允许列表。设置后，仅允许这些用户 ID。如果你想要基于角色的访问，请不要设置 `allowFrom`，而是配置 `allowedRoles`。

  </Tab>
  <Tab title="禁用 @mention 要求">
    默认情况下，`requireMention` 为 `true`。若要禁用并响应所有消息：

    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              requireMention: false,
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## 故障排除

首先运行诊断命令：

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="机器人不响应消息">
    - **检查访问控制：** 确保你的用户 ID 位于 `allowFrom` 中，或临时移除 `allowFrom` 并设置 `allowedRoles: ["all"]` 进行测试。
    - **检查机器人是否在频道中：** 机器人必须加入 `channel` 中指定的频道。

  </Accordion>
  <Accordion title="令牌问题">
    “连接失败”或认证错误：

    - 确认 `accessToken` 是 OAuth 访问令牌值（通常以 `oauth:` 前缀开头）
    - 检查令牌是否具有 `chat:read` 和 `chat:write` 作用域
    - 如果使用令牌刷新，请确认已设置 `clientSecret` 和 `refreshToken`

  </Accordion>
  <Accordion title="令牌刷新无法工作">
    检查日志中的刷新事件：

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    如果你看到 “token refresh disabled (no refresh token)”：

    - 确保已提供 `clientSecret`
    - 确保已提供 `refreshToken`

  </Accordion>
</AccordionGroup>

## 配置

### 账号配置

<ParamField path="username" type="string">
  机器人用户名。
</ParamField>
<ParamField path="accessToken" type="string">
  具有 `chat:read` 和 `chat:write` 的 OAuth 访问令牌。
</ParamField>
<ParamField path="clientId" type="string">
  Twitch Client ID（来自 Token Generator 或你的应用）。
</ParamField>
<ParamField path="channel" type="string" required>
  要加入的频道。
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  启用此账号。
</ParamField>
<ParamField path="clientSecret" type="string">
  可选：用于自动刷新令牌。
</ParamField>
<ParamField path="refreshToken" type="string">
  可选：用于自动刷新令牌。
</ParamField>
<ParamField path="expiresIn" type="number">
  令牌有效期（秒）。
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  令牌获取时间戳。
</ParamField>
<ParamField path="allowFrom" type="string[]">
  用户 ID 允许列表。
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  基于角色的访问控制。
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  要求 @mention。
</ParamField>

### 提供商选项

- `channels.twitch.enabled` - 启用/禁用渠道启动
- `channels.twitch.username` - 机器人用户名（简化的单账号配置）
- `channels.twitch.accessToken` - OAuth 访问令牌（简化的单账号配置）
- `channels.twitch.clientId` - Twitch Client ID（简化的单账号配置）
- `channels.twitch.channel` - 要加入的频道（简化的单账号配置）
- `channels.twitch.accounts.<accountName>` - 多账号配置（上方所有账号字段）

完整示例：

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## 工具动作

智能体可以调用 `twitch` 并使用 action：

- `send` - 向频道发送消息

示例：

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## 安全与运维

- **像对待密码一样对待令牌** — 切勿将令牌提交到 git。
- **使用自动令牌刷新** 适用于长期运行的机器人。
- **使用用户 ID 允许列表** 而不是用户名来进行访问控制。
- **监控日志** 以查看令牌刷新事件和连接状态。
- **最小化令牌作用域** — 仅请求 `chat:read` 和 `chat:write`。
- **如果卡住**：确认没有其他进程占用该会话后，重启 Gateway 网关。

## 限制

- 每条消息 **500 个字符**（会在词边界自动分块）。
- Markdown 会在分块前被移除。
- 无速率限制（使用 Twitch 内置速率限制）。

## 相关

- [渠道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [渠道概览](/zh-CN/channels) — 所有受支持的渠道
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [配对](/zh-CN/channels/pairing) — 私信认证与配对流程
- [安全](/zh-CN/gateway/security) — 访问模型与加固
