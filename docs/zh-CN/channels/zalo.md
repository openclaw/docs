---
read_when:
    - 开发 Zalo 功能或网络钩子
summary: Zalo 机器人支持状态、能力和配置
title: Zalo
x-i18n:
    generated_at: "2026-05-02T21:04:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65c9bdb0994228a6916e52c35fa6ea8d09b9b686bb9dac1c74cb38b3e6db1e48
    source_path: channels/zalo.md
    workflow: 16
---

Status：实验性。支持私信。下面的 [能力](#capabilities) 部分反映当前 Marketplace 机器人的行为。

## 内置插件

Zalo 在当前 OpenClaw 版本中作为内置插件随附，因此常规打包
构建不需要单独安装。

如果你使用的是较旧构建，或排除了 Zalo 的自定义安装，请直接安装
npm 包：

- 通过 CLI 安装：`openclaw plugins install @openclaw/zalo`
- Beta 渠道：`openclaw plugins install @openclaw/zalo@beta`
- 或从源码检出安装：`openclaw plugins install ./path/to/local/zalo-plugin`
- 详情：[插件](/zh-CN/tools/plugin)

## 快速设置（初学者）

1. 确保 Zalo 插件可用。
   - 当前打包的 OpenClaw 版本已内置它。
   - 较旧/自定义安装可以用上面的命令手动添加它。
2. 设置令牌：
   - Env：`ZALO_BOT_TOKEN=...`
   - 或配置：`channels.zalo.accounts.default.botToken: "..."`。
3. 重启 Gateway 网关（或完成设置）。
4. 私信访问默认通过配对；首次联系时批准配对码。

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

Zalo 是一款面向越南的消息应用；它的 Bot API 允许 Gateway 网关为一对一对话运行机器人。
当你希望确定性地路由回 Zalo 时，它很适合用于支持或通知。

本页反映当前 OpenClaw 对 **Zalo Bot Creator / Marketplace 机器人**的行为。
**Zalo Official Account (OA) 机器人**是 Zalo 的另一个产品界面，行为可能不同。

- 由 Gateway 网关拥有的 Zalo Bot API 渠道。
- 确定性路由：回复会回到 Zalo；模型永远不会选择渠道。
- 私信共享智能体的主会话。
- 下面的 [能力](#capabilities) 部分展示当前 Marketplace 机器人的支持情况。

## 设置（快速路径）

### 1) 创建机器人令牌（Zalo Bot Platform）

1. 前往 [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) 并登录。
2. 创建新机器人并配置它的设置。
3. 复制完整机器人令牌（通常是 `numeric_id:secret`）。对于 Marketplace 机器人，可用的运行时令牌可能会在创建后显示在机器人的欢迎消息中。

### 2) 配置令牌（环境变量或配置）

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

如果你以后迁移到支持群组的 Zalo 机器人界面，可以显式添加群组特定配置，例如 `groupPolicy` 和 `groupAllowFrom`。关于当前 Marketplace 机器人的行为，请参阅 [能力](#capabilities)。

环境变量选项：`ZALO_BOT_TOKEN=...`（仅适用于默认账号）。

多账号支持：使用 `channels.zalo.accounts`，并为每个账号配置令牌和可选的 `name`。

3. 重启 Gateway 网关。解析到令牌（环境变量或配置）后，Zalo 会启动。
4. 私信访问默认使用配对。机器人首次被联系时批准代码。

## 工作方式（行为）

- 入站消息会被规范化为带有媒体占位符的共享渠道信封。
- 回复始终路由回同一个 Zalo 聊天。
- 默认使用长轮询；也可以通过 `channels.zalo.webhookUrl` 使用 Webhook 模式。

## 限制

- 出站文本会被分块为 2000 个字符（Zalo API 限制）。
- 媒体下载/上传受 `channels.zalo.mediaMaxMb` 限制（默认 5）。
- 由于 2000 字符限制会降低流式传输的实用性，默认阻止流式传输。

## 访问控制（私信）

### 私信访问

- 默认：`channels.zalo.dmPolicy = "pairing"`。未知发送者会收到配对码；批准前消息会被忽略（代码 1 小时后过期）。
- 通过以下方式批准：
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- 配对是默认令牌交换方式。详情：[配对](/zh-CN/channels/pairing)
- `channels.zalo.allowFrom` 接受数字用户 ID（没有可用的用户名查找）。

## 访问控制（群组）

对于 **Zalo Bot Creator / Marketplace 机器人**，群组支持在实践中不可用，因为机器人完全无法被添加到群组。

这意味着下面的群组相关配置键存在于架构中，但 Marketplace 机器人无法使用：

- `channels.zalo.groupPolicy` 控制群组入站处理：`open | allowlist | disabled`。
- `channels.zalo.groupAllowFrom` 限制哪些发送者 ID 可以在群组中触发机器人。
- 如果未设置 `groupAllowFrom`，Zalo 会回退到 `allowFrom` 进行发送者检查。
- 运行时注意事项：如果 `channels.zalo` 完全缺失，运行时仍会为了安全回退到 `groupPolicy="allowlist"`。

群组策略值（当你的机器人界面支持群组访问时）如下：

- `groupPolicy: "disabled"` — 阻止所有群组消息。
- `groupPolicy: "open"` — 允许任何群组成员（需要提及触发）。
- `groupPolicy: "allowlist"` — 默认失败关闭；只接受允许的发送者。

如果你使用的是不同的 Zalo 机器人产品界面，并且已验证群组行为可用，请单独记录该行为，而不是假定它与 Marketplace 机器人流程一致。

## 长轮询与 Webhook

- 默认：长轮询（不需要公开 URL）。
- Webhook 模式：设置 `channels.zalo.webhookUrl` 和 `channels.zalo.webhookSecret`。
  - Webhook 密钥必须为 8-256 个字符。
  - Webhook URL 必须使用 HTTPS。
  - Zalo 会使用 `X-Bot-Api-Secret-Token` 标头发送事件以供验证。
  - Gateway 网关 HTTP 在 `channels.zalo.webhookPath` 处理 Webhook 请求（默认使用 Webhook URL 路径）。
  - 请求必须使用 `Content-Type: application/json`（或 `+json` 媒体类型）。
  - 重复事件（`event_name + message_id`）会在短暂重放窗口内被忽略。
  - 突发流量会按路径/来源限速，并可能返回 HTTP 429。

**注意：**根据 Zalo API 文档，getUpdates（轮询）和 Webhook 每个机器人互斥。

## 支持的消息类型

如需快速查看支持情况，请参阅 [能力](#capabilities)。下面的说明会在行为需要额外上下文时补充细节。

- **文本消息**：完全支持，并按 2000 字符分块。
- **文本中的纯 URL**：像普通文本输入一样处理。
- **链接预览 / 富链接卡片**：请参阅 [能力](#capabilities) 中的 Marketplace 机器人状态；它们无法可靠触发回复。
- **图片消息**：请参阅 [能力](#capabilities) 中的 Marketplace 机器人状态；入站图片处理不可靠（显示输入指示器但没有最终回复）。
- **贴纸**：请参阅 [能力](#capabilities) 中的 Marketplace 机器人状态。
- **语音便笺 / 音频文件 / 视频 / 通用文件附件**：请参阅 [能力](#capabilities) 中的 Marketplace 机器人状态。
- **不支持的类型**：会记录日志（例如来自受保护用户的消息）。

## 能力

此表总结当前 **Zalo Bot Creator / Marketplace 机器人**在 OpenClaw 中的行为。

| 功能                     | Status                                  |
| --------------------------- | --------------------------------------- |
| 直接消息             | ✅ 支持                            |
| 群组                      | ❌ Marketplace 机器人不可用   |
| 媒体（入站图片）      | ⚠️ 有限 / 请在你的环境中验证 |
| 媒体（出站图片）     | ⚠️ 尚未为 Marketplace 机器人重新测试   |
| 文本中的纯 URL          | ✅ 支持                            |
| 链接预览               | ⚠️ 对 Marketplace 机器人不可靠      |
| 反应                   | ❌ 不支持                        |
| 贴纸                    | ⚠️ Marketplace 机器人没有智能体回复  |
| 语音便笺 / 音频 / 视频 | ⚠️ Marketplace 机器人没有智能体回复  |
| 文件附件            | ⚠️ Marketplace 机器人没有智能体回复  |
| 线程                     | ❌ 不支持                        |
| 投票                       | ❌ 不支持                        |
| 原生命令             | ❌ 不支持                        |
| 流式传输                   | ⚠️ 已阻止（2000 字符限制）            |

## 递送目标（CLI/cron）

- 使用聊天 ID 作为目标。
- 示例：`openclaw message send --channel zalo --target 123456789 --message "hi"`。

## 故障排除

**机器人没有响应：**

- 检查令牌是否有效：`openclaw channels status --probe`
- 验证发送者已获批准（配对或 allowFrom）
- 检查 Gateway 网关日志：`openclaw logs --follow`

**Webhook 没有收到事件：**

- 确保 Webhook URL 使用 HTTPS
- 验证密钥令牌为 8-256 个字符
- 确认 Gateway 网关 HTTP 端点可在配置的路径上访问
- 检查 getUpdates 轮询未运行（它们互斥）

## 配置参考（Zalo）

完整配置：[配置](/zh-CN/gateway/configuration)

扁平顶层键（`channels.zalo.botToken`、`channels.zalo.dmPolicy` 等类似键）是旧版单账号简写。新配置优先使用 `channels.zalo.accounts.<id>.*`。由于这两种形式都存在于架构中，因此此处仍记录它们。

提供商选项：

- `channels.zalo.enabled`：启用/禁用渠道启动。
- `channels.zalo.botToken`：来自 Zalo Bot Platform 的机器人令牌。
- `channels.zalo.tokenFile`：从常规文件路径读取令牌。符号链接会被拒绝。
- `channels.zalo.dmPolicy`：`pairing | allowlist | open | disabled`（默认：pairing）。
- `channels.zalo.allowFrom`：私信允许列表（用户 ID）。`open` 需要 `"*"`。向导会要求输入数字 ID。
- `channels.zalo.groupPolicy`：`open | allowlist | disabled`（默认：allowlist）。存在于配置中；关于当前 Marketplace 机器人行为，请参阅 [能力](#capabilities) 和 [访问控制（群组）](#access-control-groups)。
- `channels.zalo.groupAllowFrom`：群组发送者允许列表（用户 ID）。未设置时回退到 `allowFrom`。
- `channels.zalo.mediaMaxMb`：入站/出站媒体上限（MB，默认 5）。
- `channels.zalo.webhookUrl`：启用 Webhook 模式（需要 HTTPS）。
- `channels.zalo.webhookSecret`：Webhook 密钥（8-256 个字符）。
- `channels.zalo.webhookPath`：Gateway 网关 HTTP 服务器上的 Webhook 路径。
- `channels.zalo.proxy`：API 请求的代理 URL。

多账号选项：

- `channels.zalo.accounts.<id>.botToken`：按账号配置的令牌。
- `channels.zalo.accounts.<id>.tokenFile`：按账号配置的常规令牌文件。符号链接会被拒绝。
- `channels.zalo.accounts.<id>.name`：显示名称。
- `channels.zalo.accounts.<id>.enabled`：启用/禁用账号。
- `channels.zalo.accounts.<id>.dmPolicy`：按账号配置的私信策略。
- `channels.zalo.accounts.<id>.allowFrom`：按账号配置的允许列表。
- `channels.zalo.accounts.<id>.groupPolicy`：按账号配置的群组策略。存在于配置中；关于当前 Marketplace 机器人行为，请参阅 [能力](#capabilities) 和 [访问控制（群组）](#access-control-groups)。
- `channels.zalo.accounts.<id>.groupAllowFrom`：按账号配置的群组发送者允许列表。
- `channels.zalo.accounts.<id>.webhookUrl`：按账号配置的 Webhook URL。
- `channels.zalo.accounts.<id>.webhookSecret`：按账号配置的 Webhook 密钥。
- `channels.zalo.accounts.<id>.webhookPath`：按账号配置的 Webhook 路径。
- `channels.zalo.accounts.<id>.proxy`：按账号配置的代理 URL。

## 相关

- [渠道概览](/zh-CN/channels) — 所有受支持渠道
- [配对](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) — 群组聊天行为和提及门控
- [渠道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型和加固
