---
read_when:
    - 为 OpenClaw 设置 Twitch 聊天集成
sidebarTitle: Twitch
summary: Twitch 聊天机器人：安装、凭证、访问控制、令牌刷新
title: Twitch
x-i18n:
    generated_at: "2026-07-05T11:05:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70890c0c6a648a06ad47c35016571a57c3e518296ef95311e75e32c81e60e2db
    source_path: channels/twitch.md
    workflow: 16
---

Twitch 通过 Twurple 客户端经由 Twitch 的聊天（IRC）接口提供聊天支持。OpenClaw 以 Twitch Bot 账号登录，为每个已配置账号加入一个频道，并在该频道中回复。

## 安装

Twitch 作为官方插件发布；它不是核心安装的一部分。

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="Local checkout">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

`plugins install` 会注册并启用该插件。在 `openclaw onboard` 或 `openclaw channels add` 期间选择 Twitch 会按需安装它。使用裸包名以跟随当前发布版本；只有在需要可复现安装时才固定精确版本。需要 OpenClaw 2026.4.10 或更高版本。

详情：[插件](/zh-CN/tools/plugin)

## 快速设置

<Steps>
  <Step title="安装插件">
    参见上方的[安装](#install)。
  </Step>
  <Step title="创建 Twitch Bot 账号">
    为 Bot 创建专用 Twitch 账号（或使用现有账号）。
  </Step>
  <Step title="生成凭证">
    使用 [Twitch Token Generator](https://twitchtokengenerator.com/)：

    - 选择 **Bot Token**
    - 确认已选择 `chat:read` 和 `chat:write` 权限范围
    - 复制 **Client ID** 和 **Access Token**

  </Step>
  <Step title="查找你的 Twitch 用户 ID">
    使用 [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) 将用户名转换为 Twitch 用户 ID。
  </Step>
  <Step title="配置令牌">
    - Env：`OPENCLAW_TWITCH_ACCESS_TOKEN=...`（仅默认账号）
    - 或配置：`channels.twitch.accessToken`

    如果两者都设置，配置优先（环境变量仅作为默认账号的回退）。

  </Step>
  <Step title="启动 Gateway 网关">
    ```bash
    openclaw gateway run
    ```
  </Step>
</Steps>

<Warning>
添加访问控制（`allowFrom` 或 `allowedRoles`）以防止未授权用户触发 Bot。`requireMention` 默认为 `true`。
</Warning>

最小配置：

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Bot's Twitch account (authenticates)
      accessToken: "oauth:abc123...", // OAuth access token (or use OPENCLAW_TWITCH_ACCESS_TOKEN env var)
      clientId: "xyz789...", // Client ID from Token Generator
      channel: "yourchannel", // Which Twitch channel's chat to join (required)
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only
    },
  },
}
```

## 它是什么

- 一个由 Gateway 网关拥有的 Twitch 频道。
- 确定性路由：回复始终返回到消息来源的 Twitch 频道。
- 每个已加入频道都会映射到一个隔离的群组会话键 `agent:<agentId>:twitch:group:<channel>`。
- `username` 是 Bot 的账号（用于认证），`channel` 是要加入的聊天室。一个账号条目只加入一个频道。
- 令牌带不带 `oauth:` 前缀都可以；OpenClaw 会规范化两种形式（设置向导预期使用 `oauth:` 形式）。

## 令牌刷新（可选）

来自 [Twitch Token Generator](https://twitchtokengenerator.com/) 的令牌无法由 OpenClaw 刷新 - 过期后请重新生成（它们持续数小时；无需注册应用）。

如需自动刷新，请在 [Twitch Developer Console](https://dev.twitch.tv/console) 创建你自己的应用，并添加：

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

两者都设置后，插件会使用可刷新的认证提供方，在过期前更新令牌，并记录每次刷新。没有 `refreshToken` 时，它会记录 `token refresh disabled (no refresh token)`；没有 `clientSecret` 时，它会回退到静态（不可刷新）令牌。

## 多账号支持

使用 `channels.twitch.accounts` 配置每个账号的凭证。共享模式见[配置](/zh-CN/gateway/configuration)。

示例（一个 Bot 账号加入两个频道）：

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "yourchannel",
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
每个账号条目都需要自己的 `accessToken`（环境变量仅覆盖默认账号）。一个账号只加入一个频道，因此加入两个频道意味着需要两个账号。`channels.twitch.defaultAccount` 选择哪个账号作为默认账号。
</Note>

## 访问控制

`allowFrom` 是 Twitch 用户 ID 的硬性允许列表。设置它后，`allowedRoles` 会被忽略；保留 `allowFrom` 未设置以改用基于角色的访问控制。

**可用角色：**`"moderator"`、`"owner"`、`"vip"`、`"subscriber"`、`"all"`。

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
  </Tab>
  <Tab title="禁用 @mention 要求">
    默认情况下，`requireMention` 为 `true`。要响应所有允许的消息：

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

<Note>
**为什么使用用户 ID？** 用户名可能更改，从而允许冒充。用户 ID 是永久的。

使用[用户名到 ID 转换器](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)查找你的 ID。
</Note>

## 故障排查

首先运行诊断命令：

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Bot 不响应消息">
    - **检查访问控制：**确保你的用户 ID 在 `allowFrom` 中，或临时移除 `allowFrom` 并设置 `allowedRoles: ["all"]` 进行测试。
    - **检查提及门控：**使用 `requireMention: true`（默认）时，消息必须 @mention Bot 用户名。
    - **检查 Bot 是否在频道中：**Bot 只会加入 `channel` 中命名的频道。

  </Accordion>
  <Accordion title="令牌问题">
    “Failed to connect”或认证错误：

    - 确认 `accessToken` 是 OAuth 访问令牌值（`oauth:` 前缀可选）
    - 检查令牌具有 `chat:read` 和 `chat:write` 权限范围
    - 如果使用令牌刷新，请确认已设置 `clientSecret` 和 `refreshToken`

  </Accordion>
  <Accordion title="令牌刷新不工作">
    检查日志中的刷新事件：

    ```text
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    如果看到 `token refresh disabled (no refresh token)`：

    - 确保已提供 `clientSecret`
    - 确保已提供 `refreshToken`

  </Accordion>
</AccordionGroup>

## 配置

### 账号配置

<ParamField path="username" type="string" required>
  Bot 用户名（用于认证的账号）。
</ParamField>
<ParamField path="accessToken" type="string" required>
  带有 `chat:read` 和 `chat:write` 的 OAuth 访问令牌（默认账号可使用配置或环境变量）。
</ParamField>
<ParamField path="clientId" type="string" required>
  Twitch Client ID（来自 Token Generator 或你的应用）。在 schema 中是可选的，但连接时必需。
</ParamField>
<ParamField path="channel" type="string" required>
  要加入的频道。
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  启用此账号。
</ParamField>
<ParamField path="clientSecret" type="string">
  可选：用于自动令牌刷新。
</ParamField>
<ParamField path="refreshToken" type="string">
  可选：用于自动令牌刷新。
</ParamField>
<ParamField path="expiresIn" type="number">
  令牌有效期（秒，用于刷新跟踪）。
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  获取令牌时的时间戳（用于刷新跟踪）。
</ParamField>
<ParamField path="allowFrom" type="string[]">
  用户 ID 允许列表。设置后会忽略角色。
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  基于角色的访问控制。
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  需要 @mention 才能触发 Bot。
</ParamField>
<ParamField path="responsePrefix" type="string">
  此账号的出站响应前缀覆盖。
</ParamField>

### 提供商选项

- `channels.twitch.enabled` - 启用/禁用频道启动
- `channels.twitch.username` / `accessToken` / `clientId` / `channel` - 简化的单账号配置（隐式 `default` 账号；优先于 `accounts.default`）
- `channels.twitch.accounts.<accountName>` - 多账号配置（上方所有账号字段）
- `channels.twitch.defaultAccount` - 哪个账号名是默认账号
- `channels.twitch.markdown.tables` - Markdown 表格渲染模式（`off` | `bullets` | `code` | `block`）

完整示例：

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "yourchannel",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      accounts: {
        second: {
          username: "mybot",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "your_channel",
          enabled: true,
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## 工具操作

智能体可以通过消息工具的 `send` 操作发送 Twitch 消息：

```json5
{
  channel: "twitch",
  action: "send",
  to: "#mychannel",
  message: "Hello Twitch!",
}
```

`to` 是可选的，默认使用账号配置的 `channel`。

## 安全与运维

- **像对待密码一样对待令牌** - 切勿将令牌提交到 git。
- **使用自动令牌刷新**，用于长时间运行的 Bot。
- **使用用户 ID 允许列表**，而不是用户名，进行访问控制。
- **监控日志**中的令牌刷新事件和连接状态。
- **最小化令牌权限范围** - 只请求 `chat:read` 和 `chat:write`。
- **如果卡住**：确认没有其他进程占用会话后，重启 Gateway 网关。

## 限制

- 每条消息 **500 个字符**；更长的回复会按词边界分块。
- 发送前会剥离 Markdown（Twitch 聊天是纯文本；换行会变为空格）。
- OpenClaw 不添加自己的速率限制；Twurple 聊天客户端会处理 Twitch 速率限制。

## 相关

- [频道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [配对](/zh-CN/channels/pairing) — 私信认证和配对流程
- [安全](/zh-CN/gateway/security) — 访问模型和加固
