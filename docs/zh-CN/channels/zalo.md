---
read_when:
    - 处理 Zalo 功能或 webhook 时
summary: Zalo Bot 的支持状态、能力和配置
title: Zalo
x-i18n:
    generated_at: "2026-04-05T08:18:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab94642ba28e79605b67586af8f71c18bc10e0af60343a7df508e6823b6f4119
    source_path: channels/zalo.md
    workflow: 15
---

# Zalo（Bot API）

状态：实验性。支持私信。下方的[功能](#capabilities)部分反映了当前 Marketplace Bot 的行为。

## 内置插件

Zalo 在当前 OpenClaw 版本中作为内置插件提供，因此普通的打包构建不需要单独安装。

如果你使用的是较旧版本，或者使用了不包含 Zalo 的自定义安装，请手动安装：

- 通过 CLI 安装：`openclaw plugins install @openclaw/zalo`
- 或从源码检出安装：`openclaw plugins install ./path/to/local/zalo-plugin`
- 详情：[插件](/tools/plugin)

## 快速设置（新手）

1. 确保 Zalo 插件可用。
   - 当前打包的 OpenClaw 版本已内置该插件。
   - 较旧版本或自定义安装可使用上述命令手动添加。
2. 设置令牌：
   - 环境变量：`ZALO_BOT_TOKEN=...`
   - 或配置：`channels.zalo.accounts.default.botToken: "..."`。
3. 重启 Gateway 网关（或完成设置）。
4. 私信访问默认使用配对；首次联系时请批准配对码。

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

## 它是什么

Zalo 是一款面向越南市场的即时通讯应用；它的 Bot API 允许 Gateway 网关为一对一会话运行一个机器人。
如果你希望以确定性的方式将消息路由回 Zalo，它非常适合用于支持或通知场景。

本页反映的是当前 OpenClaw 对 **Zalo Bot Creator / Marketplace Bot** 的行为。
**Zalo Official Account（OA）Bot** 属于另一种 Zalo 产品形态，其行为可能不同。

- 一个由 Gateway 网关持有的 Zalo Bot API 渠道。
- 确定性路由：回复会返回到 Zalo；模型不会自行选择渠道。
- 私信共享智能体的主会话。
- 下方的[功能](#capabilities)部分展示了当前 Marketplace Bot 的支持情况。

## 设置（快速路径）

### 1）创建 bot token（Zalo Bot Platform）

1. 前往 [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) 并登录。
2. 创建一个新的 bot 并配置其设置。
3. 复制完整的 bot token（通常为 `numeric_id:secret`）。对于 Marketplace Bot，可用的运行时令牌可能会在创建后出现在 bot 的欢迎消息中。

### 2）配置令牌（环境变量或配置）

示例：

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

如果你以后迁移到支持群组的 Zalo Bot 产品形态，可以显式添加特定于群组的配置，例如 `groupPolicy` 和 `groupAllowFrom`。对于当前 Marketplace Bot 的行为，请参阅[功能](#capabilities)。

环境变量选项：`ZALO_BOT_TOKEN=...`（仅适用于默认账户）。

多账户支持：使用 `channels.zalo.accounts`，为每个账户配置各自的令牌和可选的 `name`。

3. 重启 Gateway 网关。解析到令牌后（环境变量或配置），Zalo 就会启动。
4. 私信访问默认使用配对。首次联系 bot 时请批准配对码。

## 工作原理（行为）

- 入站消息会被规范化为共享渠道信封格式，并带有媒体占位符。
- 回复始终会路由回同一个 Zalo 聊天。
- 默认使用长轮询；也可通过 `channels.zalo.webhookUrl` 使用 webhook 模式。

## 限制

- 出站文本会被分块为 2000 个字符（Zalo API 限制）。
- 媒体下载/上传大小受 `channels.zalo.mediaMaxMb` 限制（默认 5）。
- 默认阻止流式传输，因为 2000 字符限制使流式传输的价值较低。

## 访问控制（私信）

### 私信访问

- 默认：`channels.zalo.dmPolicy = "pairing"`。未知发送者会收到一个配对码；在获得批准前其消息会被忽略（配对码 1 小时后过期）。
- 批准方式：
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- 配对是默认的令牌交换方式。详情：[配对](/channels/pairing)
- `channels.zalo.allowFrom` 接受数字用户 ID（不提供用户名查询）。

## 访问控制（群组）

对于 **Zalo Bot Creator / Marketplace Bot**，群组支持在实际使用中不可用，因为该 bot 根本无法被添加到群组中。

这意味着下面这些与群组相关的配置键虽然存在于 schema 中，但对于 Marketplace Bot 并不可用：

- `channels.zalo.groupPolicy` 控制群组入站处理：`open | allowlist | disabled`。
- `channels.zalo.groupAllowFrom` 限制哪些发送者 ID 可以在群组中触发该 bot。
- 如果未设置 `groupAllowFrom`，Zalo 会回退到 `allowFrom` 进行发送者检查。
- 运行时说明：如果 `channels.zalo` 完全缺失，运行时仍会为了安全回退到 `groupPolicy="allowlist"`。

群组策略值（当你的 bot 产品形态支持群组访问时）如下：

- `groupPolicy: "disabled"` — 阻止所有群组消息。
- `groupPolicy: "open"` — 允许任何群成员（受提及门控限制）。
- `groupPolicy: "allowlist"` — 默认失败关闭；仅接受被允许的发送者。

如果你使用的是其他 Zalo Bot 产品形态，并且已经验证群组行为可正常工作，请单独记录其行为，而不要假设它与 Marketplace Bot 流程一致。

## 长轮询与 webhook

- 默认：长轮询（不需要公共 URL）。
- webhook 模式：设置 `channels.zalo.webhookUrl` 和 `channels.zalo.webhookSecret`。
  - webhook 密钥长度必须为 8 到 256 个字符。
  - webhook URL 必须使用 HTTPS。
  - Zalo 会通过 `X-Bot-Api-Secret-Token` 请求头发送事件以供验证。
  - Gateway 网关 HTTP 会在 `channels.zalo.webhookPath` 处理 webhook 请求（默认为 webhook URL 的路径）。
  - 请求必须使用 `Content-Type: application/json`（或 `+json` 媒体类型）。
  - 重复事件（`event_name + message_id`）会在短暂的重放窗口内被忽略。
  - 突发流量会按路径/来源进行速率限制，并可能返回 HTTP 429。

**注意：**根据 Zalo API 文档，getUpdates（轮询）与 webhook 对同一个 Zalo API 来说是互斥的。

## 支持的消息类型

如需快速查看支持情况，请参阅[功能](#capabilities)。下面的说明补充了需要更多上下文的行为细节。

- **文本消息**：完全支持，按 2000 个字符分块。
- **文本中的普通 URL**：行为与普通文本输入相同。
- **链接预览 / 富链接卡片**：请参阅[功能](#capabilities)中的 Marketplace Bot 状态；它们不能可靠地触发回复。
- **图片消息**：请参阅[功能](#capabilities)中的 Marketplace Bot 状态；入站图片处理不稳定（显示输入中指示器，但没有最终回复）。
- **贴纸**：请参阅[功能](#capabilities)中的 Marketplace Bot 状态。
- **语音消息 / 音频文件 / 视频 / 通用文件附件**：请参阅[功能](#capabilities)中的 Marketplace Bot 状态。
- **不支持的类型**：会记录日志（例如来自受保护用户的消息）。

## 功能

此表总结了 OpenClaw 中当前 **Zalo Bot Creator / Marketplace Bot** 的行为。

| 功能 | 状态 |
| --------------------------- | --------------------------------------- |
| 私信 | ✅ 支持 |
| 群组 | ❌ Marketplace Bot 不可用 |
| 媒体（入站图片） | ⚠️ 有限 / 请在你的环境中验证 |
| 媒体（出站图片） | ⚠️ Marketplace Bot 未重新测试 |
| 文本中的普通 URL | ✅ 支持 |
| 链接预览 | ⚠️ Marketplace Bot 不稳定 |
| 表情回应 | ❌ 不支持 |
| 贴纸 | ⚠️ Marketplace Bot 无智能体回复 |
| 语音消息 / 音频 / 视频 | ⚠️ Marketplace Bot 无智能体回复 |
| 文件附件 | ⚠️ Marketplace Bot 无智能体回复 |
| 线程 | ❌ 不支持 |
| 投票 | ❌ 不支持 |
| 原生命令 | ❌ 不支持 |
| 流式传输 | ⚠️ 已阻止（2000 字符限制） |

## 投递目标（CLI/cron）

- 使用聊天 ID 作为目标。
- 示例：`openclaw message send --channel zalo --target 123456789 --message "hi"`。

## 故障排除

**Bot 没有响应：**

- 检查令牌是否有效：`openclaw channels status --probe`
- 验证发送者是否已获批准（配对或 allowFrom）
- 检查 Gateway 网关日志：`openclaw logs --follow`

**Webhook 没有接收到事件：**

- 确保 webhook URL 使用 HTTPS
- 验证密钥令牌长度为 8 到 256 个字符
- 确认 Gateway 网关 HTTP 端点可通过已配置路径访问
- 检查 getUpdates 轮询是否仍在运行（它们互斥）

## 配置参考（Zalo）

完整配置：[配置](/gateway/configuration)

扁平的顶层键（`channels.zalo.botToken`、`channels.zalo.dmPolicy` 以及类似项）是旧版的单账户简写。对于新配置，优先使用 `channels.zalo.accounts.<id>.*`。这两种形式目前仍在此处记录，因为它们仍存在于 schema 中。

提供商选项：

- `channels.zalo.enabled`：启用/禁用渠道启动。
- `channels.zalo.botToken`：来自 Zalo Bot Platform 的 bot token。
- `channels.zalo.tokenFile`：从普通文件路径读取令牌。不接受符号链接。
- `channels.zalo.dmPolicy`：`pairing | allowlist | open | disabled`（默认：pairing）。
- `channels.zalo.allowFrom`：私信允许列表（用户 ID）。`open` 需要 `"*"`。向导会要求输入数字 ID。
- `channels.zalo.groupPolicy`：`open | allowlist | disabled`（默认：allowlist）。配置中存在；当前 Marketplace Bot 的行为请参阅[功能](#capabilities)和[访问控制（群组）](#access-control-groups)。
- `channels.zalo.groupAllowFrom`：群组发送者允许列表（用户 ID）。未设置时会回退到 `allowFrom`。
- `channels.zalo.mediaMaxMb`：入站/出站媒体大小上限（MB，默认 5）。
- `channels.zalo.webhookUrl`：启用 webhook 模式（必须使用 HTTPS）。
- `channels.zalo.webhookSecret`：webhook 密钥（8 到 256 个字符）。
- `channels.zalo.webhookPath`：Gateway 网关 HTTP 服务器上的 webhook 路径。
- `channels.zalo.proxy`：API 请求的代理 URL。

多账户选项：

- `channels.zalo.accounts.<id>.botToken`：每账户令牌。
- `channels.zalo.accounts.<id>.tokenFile`：每账户普通令牌文件。不接受符号链接。
- `channels.zalo.accounts.<id>.name`：显示名称。
- `channels.zalo.accounts.<id>.enabled`：启用/禁用账户。
- `channels.zalo.accounts.<id>.dmPolicy`：每账户私信策略。
- `channels.zalo.accounts.<id>.allowFrom`：每账户允许列表。
- `channels.zalo.accounts.<id>.groupPolicy`：每账户群组策略。配置中存在；当前 Marketplace Bot 的行为请参阅[功能](#capabilities)和[访问控制（群组）](#access-control-groups)。
- `channels.zalo.accounts.<id>.groupAllowFrom`：每账户群组发送者允许列表。
- `channels.zalo.accounts.<id>.webhookUrl`：每账户 webhook URL。
- `channels.zalo.accounts.<id>.webhookSecret`：每账户 webhook 密钥。
- `channels.zalo.accounts.<id>.webhookPath`：每账户 webhook 路径。
- `channels.zalo.accounts.<id>.proxy`：每账户代理 URL。

## 相关内容

- [渠道概览](/channels) — 所有支持的渠道
- [配对](/channels/pairing) — 私信认证与配对流程
- [群组](/channels/groups) — 群聊行为与提及门控
- [渠道路由](/channels/channel-routing) — 消息的会话路由
- [安全性](/gateway/security) — 访问模型与加固
