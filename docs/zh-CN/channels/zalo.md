---
read_when:
    - 开发 Zalo 功能或 Webhooks
summary: Zalo 机器人支持状态、能力和配置
title: Zalo
x-i18n:
    generated_at: "2026-07-05T11:05:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 36e624f1abeeaee56d7376b9df9209f8e7614ade2f089bcecd76ff746b942765
    source_path: channels/zalo.md
    workflow: 16
---

状态：实验性。私信和群聊均已实现；下面的 [能力](#capabilities) 表反映了在 Zalo Bot Creator / Marketplace bot 上验证过的行为。

## 内置插件

在当前 OpenClaw 版本中，Zalo 作为内置插件随附，因此打包构建不需要单独安装。

在较旧构建或排除了 Zalo 的自定义安装中，请直接安装 npm 包：

- 安装：`openclaw plugins install @openclaw/zalo`
- 固定版本：`openclaw plugins install @openclaw/zalo@2026.6.11`
- 从本地检出安装：`openclaw plugins install ./path/to/local/zalo-plugin`
- 详情：[插件](/zh-CN/tools/plugin)

## 快速设置

1. 在 [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) 创建 bot token（登录、创建 bot、配置设置）。该 token 为 `numeric_id:secret`；对于 Marketplace bot，可用的运行时 token 可能会出现在 bot 的欢迎消息中。
2. 设置 token，可以通过环境变量 `ZALO_BOT_TOKEN=...`（仅默认账户），也可以在配置中设置。
3. 重启 Gateway 网关。
4. 首次私信联系时批准配对码（默认私信策略为配对）。

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

多账户：在 `channels.zalo.accounts.<id>` 下添加更多条目，每个条目都有自己的 `botToken`/`name`。`channels.zalo.botToken`（扁平结构，无 `accounts`）是旧版单账户简写；新配置优先使用 `accounts.<id>.*`。

## 它是什么

Zalo 是一款面向越南的消息应用。它的 Bot API 让 Gateway 网关可以为 1:1 对话和群聊运行 bot，并确定性地路由回 Zalo（模型绝不会选择渠道）。

本页覆盖 **Zalo Bot Creator / Marketplace bot**。**Zalo Official Account (OA) bot** 是不同的产品表面，行为可能不同；本页不覆盖它们。

## 工作方式

- 入站消息会被规范化为带有媒体占位符的共享渠道信封。
- 回复始终路由回同一个 Zalo 聊天；不会使用引用回复（`replyToMode` 固定关闭）。
- 默认使用长轮询（`getUpdates`）；也可通过 `channels.zalo.webhookUrl` 使用 webhook 模式。
- 群组需要 @mention 才会触发 bot；此项不能按渠道配置。

## 限制

| 限制                           | 值                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------ |
| 出站文本分块大小               | 2000 个字符（Zalo API 限制）                                                   |
| 媒体大小（入站/出站）          | `channels.zalo.mediaMaxMb`，默认 `5` MB                                        |
| Webhook 请求正文               | 1 MB，30 秒读取超时                                                            |
| Webhook 速率限制               | 每 path+client IP 每 60 秒 120 个请求，之后返回 HTTP 429                       |
| Webhook 重复事件窗口           | 5 分钟（按 path + account + event name + chat + sender + message id 作为键）   |

## 访问控制

### 私信

- `channels.zalo.dmPolicy`：`pairing`（默认）| `allowlist` | `open` | `disabled`。
- 配对：未知发送者会收到配对码；消息会被忽略，直到批准。配对码 1 小时后过期。
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
  - 详情：[配对](/zh-CN/channels/pairing)
- `channels.zalo.allowFrom` 接受数字形式的 Zalo 用户 ID（不进行用户名查找）。`open` 需要 `"*"`。

### 群组

插件支持群聊（`chatTypes: ["direct", "group"]`），并由提及和群组策略共同控制：

- `channels.zalo.groupPolicy`：`open` | `allowlist` | `disabled`。
- `channels.zalo.groupAllowFrom` 限制哪些发送者 ID 可以在群组中触发 bot；未设置时回退到 `allowFrom`。
- 默认解析：当配置了 `channels.zalo` 时，未设置的 `groupPolicy` 会解析为 `open`。当完全缺少 `channels.zalo` 时，运行时会故障关闭到 `allowlist`。
- 已报告的真实环境注意事项：在某些 Marketplace bot 设置中，bot 根本无法加入群组。如果遇到这种情况，请用你的 bot 的 Zalo Bot Platform 设置进行验证；这是平台侧约束，不是 OpenClaw 策略。

## 长轮询与 webhook

- 默认：长轮询（不需要公网 URL）。
- Webhook 模式：设置 `channels.zalo.webhookUrl` 和 `channels.zalo.webhookSecret`。
  - Webhook URL 必须使用 HTTPS。
  - Webhook secret 必须为 8-256 个字符。
  - Zalo 会通过 `X-Bot-Api-Secret-Token` 标头发送事件，并使用常量时间比较进行检查。
  - Gateway 网关 HTTP 在 `channels.zalo.webhookPath` 处理 webhook 请求（默认为 webhook URL 的路径）。
  - 请求必须使用 `Content-Type: application/json`（或 `+json` 媒体类型）。
  - 根据 Zalo API 文档，getUpdates 轮询和 webhook 每个 Zalo API 互斥。

## 支持的消息类型

- 文本：完全支持，分块为 2000 个字符。
- 媒体：入站/出站，受 `mediaMaxMb` 限制。
- 表情回应、话题、投票、原生命令：插件不支持。
- 流式传输：插件声明了分块流式传输能力，但 Zalo 没有专用的出站队列/文本合并调优旋钮（不同于一些其他区域渠道）；如果这对你的用例很重要，请在你的环境中验证当前行为。

## 能力

| 功能                     | 状态                              |
| ------------------------ | --------------------------------- |
| 私信                     | 支持                              |
| 群组                     | 支持（由提及门控）                |
| 媒体（入站/出站）        | 支持，受 `mediaMaxMb` 限制        |
| 表情回应                 | 不支持                            |
| 话题                     | 不支持                            |
| 投票                     | 不支持                            |
| 原生命令                 | 不支持                            |
| 回复到 / 引用            | 不使用（固定关闭）                |

## 投递目标（CLI/cron）

使用聊天 ID 作为目标：

```bash
openclaw message send --channel zalo --target 123456789 --message "hi"
```

## 故障排查

**Bot 不响应：**

- 检查 token：`openclaw channels status --probe`
- 验证发送者已获批准（配对或 `allowFrom`）
- 检查 Gateway 网关日志：`openclaw logs --follow`

**Webhook 未收到事件：**

- 确认 webhook URL 使用 HTTPS
- 确认 secret 为 8-256 个字符
- 确认 Gateway 网关 HTTP 端点可在配置的路径上访问
- 确认 getUpdates 轮询没有同时运行（两者互斥）
- 突发请求可能返回 HTTP 429（每 path+IP 每 60 秒 120 个请求）；请退避后重试

## 配置参考

完整配置：[配置](/zh-CN/gateway/configuration)

| 设置                                         | 描述                                              | 默认值                |
| -------------------------------------------- | ------------------------------------------------- | --------------------- |
| `channels.zalo.enabled`                      | 启用/禁用渠道启动                                 | `true`                |
| `channels.zalo.accounts.<id>.botToken`       | 来自 Zalo Bot Platform 的 bot token               | -                     |
| `channels.zalo.accounts.<id>.tokenFile`      | 从文件读取 token（拒绝符号链接）                  | -                     |
| `channels.zalo.accounts.<id>.name`           | 显示名称                                          | -                     |
| `channels.zalo.accounts.<id>.enabled`        | 启用/禁用此账户                                   | `true`                |
| `channels.zalo.accounts.<id>.dmPolicy`       | 按账户配置的私信策略                              | `pairing`             |
| `channels.zalo.accounts.<id>.allowFrom`      | 私信允许列表（用户 ID）                           | -                     |
| `channels.zalo.accounts.<id>.groupPolicy`    | 按账户配置的群组策略                              | 见 [群组](#groups)    |
| `channels.zalo.accounts.<id>.groupAllowFrom` | 群组发送者允许列表；回退到 `allowFrom`            | -                     |
| `channels.zalo.accounts.<id>.mediaMaxMb`     | 入站/出站媒体上限（MB）                           | `5`                   |
| `channels.zalo.accounts.<id>.webhookUrl`     | 启用 webhook 模式（需要 HTTPS）                   | -                     |
| `channels.zalo.accounts.<id>.webhookSecret`  | Webhook secret（8-256 个字符）                    | -                     |
| `channels.zalo.accounts.<id>.webhookPath`    | Gateway 网关 HTTP 服务器上的 webhook 路径         | webhook URL 路径      |
| `channels.zalo.accounts.<id>.proxy`          | API 请求的代理 URL                                | -                     |
| `channels.zalo.accounts.<id>.responsePrefix` | 出站响应前缀覆盖                                  | -                     |
| `channels.zalo.defaultAccount`               | 配置多个账户时的默认账户                          | `default`             |

`channels.zalo.botToken`、`channels.zalo.dmPolicy` 和其他扁平顶级键是上述字段的旧版单账户简写；两种形式都受支持。

环境变量选项：`ZALO_BOT_TOKEN=...` 仅解析默认账户的 token。

## 相关内容

- [渠道概览](/zh-CN/channels) - 所有支持的渠道
- [配对](/zh-CN/channels/pairing) - 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) - 群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) - 消息的会话路由
- [安全](/zh-CN/gateway/security) - 访问模型和加固
