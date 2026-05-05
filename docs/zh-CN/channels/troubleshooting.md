---
read_when:
    - 渠道传输协议显示已连接，但回复失败
    - 在深入查看提供商文档之前，你需要先进行特定渠道的检查
summary: 快速渠道级故障排除，包含按渠道的失败特征和修复方法
title: 渠道故障排除
x-i18n:
    generated_at: "2026-05-05T08:03:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 360184c41ce6929c696688af597c5104a8a28b54620c354f7ee400a2e5490519
    source_path: channels/troubleshooting.md
    workflow: 16
---

此页适用于渠道已连接但行为异常的情况。

## 命令阶梯

先按顺序运行这些命令：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

健康基线：

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable`, or `admin-capable`
- 渠道探测显示传输已连接，并且在支持的情况下显示 `works` 或 `audit ok`

## WhatsApp

### WhatsApp 故障特征

| 症状                                | 最快检查                                            | 修复                                                                                                               |
| ----------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 已连接但没有私信回复                | `openclaw pairing list whatsapp`                    | 批准发送者，或切换私信策略/允许列表。                                                                              |
| 群组消息被忽略                      | 检查配置中的 `requireMention` + 提及模式            | 提及 bot，或放宽该群组的提及策略。                                                                                 |
| 二维码登录超时并显示 408            | 检查 Gateway 网关的 `HTTPS_PROXY` / `HTTP_PROXY` 环境变量 | 设置可达代理；仅将 `NO_PROXY` 用于绕过。                                                                           |
| 随机断开/重新登录循环               | `openclaw channels status --probe` + 日志           | 即使当前已连接，最近的重新连接也会被标记；查看日志、重启 Gateway 网关，如果持续抖动则重新链接。                   |
| 回复晚到几秒/几分钟                 | `openclaw doctor --fix`                             | Doctor 会停止已验证的过期本地 TUI 客户端，因为它们会降低 Gateway 网关事件循环性能。                              |

完整故障排除：[WhatsApp 故障排除](/zh-CN/channels/whatsapp#troubleshooting)

## Telegram

### Telegram 故障特征

| 症状                                 | 最快检查                                         | 修复                                                                                                                       |
| ------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `/start` 后没有可用回复流程          | `openclaw pairing list telegram`                 | 批准配对，或更改私信策略。                                                                                                 |
| bot 在线但群组保持静默               | 验证提及要求和 bot 隐私模式                      | 关闭隐私模式以获得群组可见性，或提及 bot。                                                                                |
| 发送失败并出现网络错误               | 检查日志中的 Telegram API 调用失败               | 修复到 `api.telegram.org` 的 DNS/IPv6/代理路由。                                                                           |
| 启动报告 `getMe returned 401`        | 检查配置的令牌来源                               | 重新复制或重新生成 BotFather 令牌，并更新 `botToken`、`tokenFile` 或默认账户 `TELEGRAM_BOT_TOKEN`。                       |
| 轮询停滞或重新连接缓慢               | 使用 `openclaw logs --follow` 查看轮询诊断       | 升级；如果重启是误报，调整 `pollingStallThresholdMs`。持续停滞仍然指向代理/DNS/IPv6 问题。                                |
| 启动时 `setMyCommands` 被拒绝        | 检查日志中的 `BOT_COMMANDS_TOO_MUCH`             | 减少插件/skill/自定义 Telegram 命令，或禁用原生命令菜单。                                                                 |
| 升级后允许列表阻止了你               | `openclaw security audit` 和配置允许列表         | 运行 `openclaw doctor --fix`，或将 `@username` 替换为数字发送者 ID。                                                       |

完整故障排除：[Telegram 故障排除](/zh-CN/channels/telegram#troubleshooting)

## Discord

### Discord 故障特征

| 症状                                      | 最快检查                                                               | 修复                                                                                                                                                              |
| ----------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| bot 在线但没有 guild 回复                 | `openclaw channels status --probe`                                     | 允许 guild/频道，并验证消息内容 intent。                                                                                                                          |
| 群组消息被忽略                            | 检查日志中的提及门控丢弃记录                                           | 提及 bot，或设置 guild/频道 `requireMention: false`。                                                                                                             |
| 有输入中/令牌用量但没有 Discord 消息      | 会话日志显示 assistant 文本且 `didSendViaMessagingTool: false`         | 模型私下回答，而不是调用消息工具。使用工具调用可靠的模型，或设置 `messages.groupChat.visibleReplies: "automatic"` 以自动发布。                                   |
| 私信回复缺失                              | `openclaw pairing list discord`                                        | 批准私信配对，或调整私信策略。                                                                                                                                     |

完整故障排除：[Discord 故障排除](/zh-CN/channels/discord#troubleshooting)

## Slack

### Slack 故障特征

| 症状                                   | 最快检查                                  | 修复                                                                                                                                                    |
| -------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode 已连接但没有响应           | `openclaw channels status --probe`        | 验证应用令牌 + bot 令牌和必需 scopes；在 SecretRef 支持的设置中关注 `botTokenStatus` / `appTokenStatus = configured_unavailable`。                      |
| 私信被阻止                             | `openclaw pairing list slack`             | 批准配对，或放宽私信策略。                                                                                                                              |
| 频道消息被忽略                         | 检查 `groupPolicy` 和频道允许列表         | 允许该频道，或将策略切换为 `open`。                                                                                                                     |

完整故障排除：[Slack 故障排除](/zh-CN/channels/slack#troubleshooting)

## iMessage 和 BlueBubbles

### iMessage 和 BlueBubbles 故障特征

| 症状                             | 最快检查                                                                | 修复                                                  |
| -------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| 没有入站事件                     | 验证 webhook/服务器可达性和应用权限                                     | 修复 webhook URL 或 BlueBubbles 服务器状态。          |
| macOS 上可以发送但无法接收       | 检查 Messages 自动化的 macOS 隐私权限                                   | 重新授予 TCC 权限并重启渠道进程。                     |
| 私信发送者被阻止                 | `openclaw pairing list imessage` 或 `openclaw pairing list bluebubbles` | 批准配对，或更新允许列表。                            |

完整故障排除：

- [iMessage 故障排除](/zh-CN/channels/imessage#troubleshooting)
- [BlueBubbles 故障排除](/zh-CN/channels/bluebubbles#troubleshooting)

## Signal

### Signal 故障特征

| 症状                          | 最快检查                                   | 修复                                                     |
| ----------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| daemon 可达但 bot 静默        | `openclaw channels status --probe`         | 验证 `signal-cli` daemon URL/账户和接收模式。            |
| 私信被阻止                    | `openclaw pairing list signal`             | 批准发送者，或调整私信策略。                             |
| 群组回复未触发                | 检查群组允许列表和提及模式                 | 添加发送者/群组，或放宽门控。                            |

完整故障排除：[Signal 故障排除](/zh-CN/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot 故障特征

| 症状                            | 最快检查                                    | 修复                                                            |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| bot 回复 “gone to Mars”         | 验证配置中的 `appId` 和 `clientSecret`      | 设置凭证，或重启 Gateway 网关。                                 |
| 没有入站消息                    | `openclaw channels status --probe`          | 验证 QQ Open Platform 上的凭证。                                |
| 语音未转写                      | 检查 STT 提供商配置                         | 配置 `channels.qqbot.stt` 或 `tools.media.audio`。              |
| 主动消息未到达                  | 检查 QQ 平台互动要求                        | 如果近期没有互动，QQ 可能会阻止 bot 主动发起的消息。            |

完整故障排除：[QQ Bot 故障排除](/zh-CN/channels/qqbot#troubleshooting)

## Matrix

### Matrix 故障特征

| 症状                                 | 最快检查                               | 修复                                                                         |
| ------------------------------------ | -------------------------------------- | ---------------------------------------------------------------------------- |
| 已登录但忽略房间消息                 | `openclaw channels status --probe`     | 检查 `groupPolicy`、房间允许列表和提及门控。                                  |
| 私信不处理                           | `openclaw pairing list matrix`         | 批准发送者，或调整私信策略。                                                  |
| 加密房间失败                         | `openclaw matrix verify status`        | 重新验证设备，然后检查 `openclaw matrix verify backup status`。               |
| 备份恢复待处理/损坏                  | `openclaw matrix verify backup status` | 运行 `openclaw matrix verify backup restore`，或使用恢复密钥重新运行。        |
| 交叉签名/bootstrap 看起来异常        | `openclaw matrix verify bootstrap`     | 一次性修复秘密存储、交叉签名和备份状态。                                      |

完整设置和配置：[Matrix](/zh-CN/channels/matrix)

## 相关

- [配对](/zh-CN/channels/pairing)
- [渠道路由](/zh-CN/channels/channel-routing)
- [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting)
