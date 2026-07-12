---
read_when:
    - 开发 Zalo 功能或 Webhooks
summary: Zalo Bot 支持状态、功能和配置
title: Zalo
x-i18n:
    generated_at: "2026-07-11T20:21:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 36e624f1abeeaee56d7376b9df9209f8e7614ade2f089bcecd76ff746b942765
    source_path: channels/zalo.md
    workflow: 16
---

状态：实验性。私信和群聊均已实现；下方的[能力](#capabilities)表反映了在 Zalo Bot Creator / Marketplace Bot 上经过验证的行为。

## 内置插件

在当前 OpenClaw 版本中，Zalo 作为内置插件提供，因此打包构建无需单独安装。

如果使用旧版构建，或自定义安装中排除了 Zalo，请直接安装 npm 软件包：

- 安装：`openclaw plugins install @openclaw/zalo`
- 固定版本：`openclaw plugins install @openclaw/zalo@2026.6.11`
- 从本地检出安装：`openclaw plugins install ./path/to/local/zalo-plugin`
- 详情：[插件](/zh-CN/tools/plugin)

## 快速设置

1. 在 [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) 创建 Bot 令牌（登录、创建 Bot 并配置设置）。令牌格式为 `numeric_id:secret`；对于 Marketplace Bot，可用的运行时令牌可能会显示在 Bot 的欢迎消息中。
2. 设置令牌，可以使用环境变量 `ZALO_BOT_TOKEN=...`（仅适用于默认账户），也可以在配置中设置。
3. 重启 Gateway 网关。
4. 首次通过私信联系时批准配对码（默认私信策略为配对）。

最小配置：

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

多账户：在 `channels.zalo.accounts.<id>` 下添加更多条目，每个条目都有自己的 `botToken`/`name`。`channels.zalo.botToken`（扁平结构，不含 `accounts`）是旧版单账户简写；新配置应优先使用 `accounts.<id>.*`。

## 简介

Zalo 是一款主要面向越南的消息应用。其 Bot API 允许 Gateway 网关运行一个同时服务于一对一对话和群聊的 Bot，并以确定性方式将回复路由回 Zalo（模型绝不会选择渠道）。

本页介绍 **Zalo Bot Creator / Marketplace Bot**。**Zalo Official Account (OA) Bot** 属于不同的产品界面，其行为可能有所不同；本页不涵盖此类 Bot。

## 工作原理

- 入站消息会连同媒体占位符一起规范化为共享的渠道信封。
- 回复始终路由回同一个 Zalo 聊天；不使用引用回复（`replyToMode` 固定为关闭）。
- 默认使用长轮询（`getUpdates`）；也可通过 `channels.zalo.webhookUrl` 使用 webhook 模式。
- 群组需要通过 @提及才能触发 Bot；无法按渠道配置此行为。

## 限制

| 限制                           | 值                                                                            |
| ------------------------------ | ----------------------------------------------------------------------------- |
| 出站文本分块大小               | 2000 个字符（Zalo API 限制）                                                  |
| 媒体大小（入站/出站）          | `channels.zalo.mediaMaxMb`，默认 `5` MB                                       |
| Webhook 请求正文               | 1 MB，读取超时 30 秒                                                          |
| Webhook 速率限制               | 每个路径和客户端 IP 在 60 秒内 120 个请求，之后返回 HTTP 429                  |
| Webhook 重复事件窗口           | 5 分钟（按路径 + 账户 + 事件名称 + 聊天 + 发送者 + 消息 ID 确定键）           |

## 访问控制

### 私信

- `channels.zalo.dmPolicy`：`pairing`（默认）| `allowlist` | `open` | `disabled`。
- 配对：未知发送者会收到配对码；在批准之前，消息将被忽略。配对码在 1 小时后过期。
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
  - 详情：[配对](/zh-CN/channels/pairing)
- `channels.zalo.allowFrom` 接受数字形式的 Zalo 用户 ID（不支持通过用户名查找）。`open` 要求值为 `"*"`。

### 群组

插件支持群聊（`chatTypes: ["direct", "group"]`），并通过提及和群组策略进行限制：

- `channels.zalo.groupPolicy`：`open` | `allowlist` | `disabled`。
- `channels.zalo.groupAllowFrom` 限制群组中哪些发送者 ID 可以触发 Bot；未设置时回退到 `allowFrom`。
- 默认解析规则：配置了 `channels.zalo` 时，未设置的 `groupPolicy` 会解析为 `open`。完全缺少 `channels.zalo` 时，运行时会以故障关闭方式解析为 `allowlist`。
- 已报告的实际注意事项：在某些 Marketplace Bot 设置中，Bot 完全无法添加到群组。如果遇到这种情况，请在该 Bot 的 Zalo Bot Platform 设置中核实；这是平台侧限制，并非 OpenClaw 策略。

## 长轮询与 webhook 对比

- 默认：长轮询（无需公共 URL）。
- Webhook 模式：设置 `channels.zalo.webhookUrl` 和 `channels.zalo.webhookSecret`。
  - Webhook URL 必须使用 HTTPS。
  - Webhook 密钥必须为 8–256 个字符。
  - Zalo 通过 `X-Bot-Api-Secret-Token` 标头发送事件，并使用常量时间比较进行检查。
  - Gateway 网关 HTTP 在 `channels.zalo.webhookPath` 处理 webhook 请求（默认为 webhook URL 的路径）。
  - 请求必须使用 `Content-Type: application/json`（或 `+json` 媒体类型）。
  - 根据 Zalo API 文档，getUpdates 轮询与 webhook 互斥。

## 支持的消息类型

- 文本：完全支持，按 2000 个字符分块。
- 媒体：支持入站和出站，受 `mediaMaxMb` 限制。
- 表情回应、话题串、投票、原生命令：插件不支持。
- 流式传输：插件声明了分块流式传输能力，但 Zalo 没有专用的出站队列或文本合并调优选项（不同于某些其他地区性渠道）；如果这对你的使用场景很重要，请在你的环境中验证当前行为。

## 能力

| 功能                     | 状态                              |
| ------------------------ | --------------------------------- |
| 私信                     | 支持                              |
| 群组                     | 支持（需要提及）                  |
| 媒体（入站/出站）        | 支持，受 `mediaMaxMb` 限制        |
| 表情回应                 | 不支持                            |
| 话题串                   | 不支持                            |
| 投票                     | 不支持                            |
| 原生命令                 | 不支持                            |
| 定向回复/引用            | 不使用（固定关闭）                |

## 投递目标（CLI/cron）

使用聊天 ID 作为目标：

```bash
openclaw message send --channel zalo --target 123456789 --message "hi"
```

## 故障排查

**Bot 没有响应：**

- 检查令牌：`openclaw channels status --probe`
- 确认发送者已获批准（通过配对或 `allowFrom`）
- 检查 Gateway 网关日志：`openclaw logs --follow`

**Webhook 未收到事件：**

- 确认 webhook URL 使用 HTTPS
- 确认密钥为 8–256 个字符
- 确认可通过配置的路径访问 Gateway 网关 HTTP 端点
- 确认 getUpdates 轮询没有同时运行（两者互斥）
- 请求突增可能导致返回 HTTP 429（每个路径和 IP 在 60 秒内 120 个请求）；请降低请求频率后重试

## 配置参考

完整配置：[配置](/zh-CN/gateway/configuration)

| 设置                                         | 说明                                              | 默认值                |
| -------------------------------------------- | ------------------------------------------------- | --------------------- |
| `channels.zalo.enabled`                      | 启用/禁用渠道启动                                 | `true`                |
| `channels.zalo.accounts.<id>.botToken`       | 来自 Zalo Bot Platform 的 Bot 令牌                | -                     |
| `channels.zalo.accounts.<id>.tokenFile`      | 从文件读取令牌（拒绝符号链接）                    | -                     |
| `channels.zalo.accounts.<id>.name`           | 显示名称                                          | -                     |
| `channels.zalo.accounts.<id>.enabled`        | 启用/禁用此账户                                   | `true`                |
| `channels.zalo.accounts.<id>.dmPolicy`       | 每账户私信策略                                    | `pairing`             |
| `channels.zalo.accounts.<id>.allowFrom`      | 私信允许列表（用户 ID）                           | -                     |
| `channels.zalo.accounts.<id>.groupPolicy`    | 每账户群组策略                                    | 参见[群组](#groups)   |
| `channels.zalo.accounts.<id>.groupAllowFrom` | 群组发送者允许列表；回退到 `allowFrom`            | -                     |
| `channels.zalo.accounts.<id>.mediaMaxMb`     | 入站/出站媒体上限（MB）                           | `5`                   |
| `channels.zalo.accounts.<id>.webhookUrl`     | 启用 webhook 模式（必须使用 HTTPS）               | -                     |
| `channels.zalo.accounts.<id>.webhookSecret`  | Webhook 密钥（8–256 个字符）                      | -                     |
| `channels.zalo.accounts.<id>.webhookPath`    | Gateway 网关 HTTP 服务器上的 webhook 路径         | webhook URL 路径      |
| `channels.zalo.accounts.<id>.proxy`          | API 请求的代理 URL                                | -                     |
| `channels.zalo.accounts.<id>.responsePrefix` | 覆盖出站响应前缀                                  | -                     |
| `channels.zalo.defaultAccount`               | 配置多个账户时使用的默认账户                      | `default`             |

`channels.zalo.botToken`、`channels.zalo.dmPolicy` 和其他扁平顶层键是上述字段的旧版单账户简写；两种形式均受支持。

环境变量选项：`ZALO_BOT_TOKEN=...` 仅解析为默认账户的令牌。

## 相关内容

- [渠道概览](/zh-CN/channels) - 所有受支持的渠道
- [配对](/zh-CN/channels/pairing) - 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) - 群聊行为和提及限制
- [频道路由](/zh-CN/channels/channel-routing) - 消息的会话路由
- [安全性](/zh-CN/gateway/security) - 访问模型和安全加固
