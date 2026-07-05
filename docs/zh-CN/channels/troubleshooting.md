---
read_when:
    - 渠道传输显示已连接但回复失败
    - 你需要先进行渠道特定检查，然后再深入提供商文档
summary: 快速的渠道级故障排查，包含每个渠道的故障特征和修复方法
title: 渠道故障排查
x-i18n:
    generated_at: "2026-07-05T11:04:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2699b48ed6ab1f702789d2180daa43aed6ee83023889d0d8821faceb9a943b5
    source_path: channels/troubleshooting.md
    workflow: 16
---

当渠道已连接但行为不正确时，请使用本页。

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
- `Capability: read-only`、`write-capable` 或 `admin-capable`
- 渠道探测显示传输协议已连接，并且在支持的情况下显示 `works` 或 `audit ok`

## 更新后

当 Telegram、iMessage、BlueBubbles 时代的配置或其他插件渠道在更新后消失时，
请使用这个流程。

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

在 `openclaw status --all` 中查找 `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`。这表示渠道已配置，但插件设置/加载遇到了损坏的依赖树，
因此没有注册该渠道。`openclaw doctor --fix` 会清除陈旧的插件运行时依赖符号链接和陈旧的凭证影子，
然后 `openclaw gateway restart` 会重新加载干净状态。

## WhatsApp

### WhatsApp 故障特征

| 症状                                | 最快检查                                            | 修复                                                                                                                              |
| ----------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 已连接但没有私信回复                | `openclaw pairing list whatsapp`                    | 批准发送者，或切换私信策略/允许列表。                                                                                            |
| 群组消息被忽略                      | 检查配置中的 `requireMention` 和提及模式            | 提及 Bot，或放宽该群组的提及策略。                                                                                               |
| 二维码登录超时并返回 408            | 检查 Gateway 网关 `HTTPS_PROXY` / `HTTP_PROXY` 环境变量 | 设置可访问的代理；仅将 `NO_PROXY` 用于绕过。                                                                                     |
| 随机断开/重新登录循环               | `openclaw channels status --probe` + 日志           | 即使当前已连接，最近的重连也会被标记；查看日志，重启 Gateway 网关，如果仍持续抖动则重新关联。                                   |
| `status=408 Request Time-out` 循环  | 探测、日志、Doctor，然后检查 Gateway 网关状态       | 先修复主机连接/时序问题；如果循环持续，备份凭证并重新关联账号。                                                                  |
| 回复延迟数秒/数分钟到达             | `openclaw doctor --fix`                             | Doctor 会停止经验证的陈旧本地 TUI 客户端，因为它们正在拖慢 Gateway 网关事件循环。                                                |

完整故障排查：[WhatsApp 故障排查](/zh-CN/channels/whatsapp#troubleshooting)

## Telegram

### Telegram 故障特征

| 症状                                  | 最快检查                                         | 修复                                                                                                                        |
| ------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `/start` 后没有可用回复流程           | `openclaw pairing list telegram`                 | 批准配对或更改私信策略。                                                                                                    |
| Bot 在线但群组保持静默                | 验证提及要求和 Bot 隐私模式                      | 关闭隐私模式以获得群组可见性，或提及 Bot。                                                                                  |
| 发送失败并出现网络错误                | 检查日志中的 Telegram API 调用失败               | 修复到 `api.telegram.org` 的 DNS/IPv6/代理路由。                                                                            |
| 启动报告 `getMe returned 401`         | 检查配置的令牌来源                               | 重新复制或重新生成 BotFather 令牌，并更新 `botToken`、`tokenFile` 或默认账号 `TELEGRAM_BOT_TOKEN`。                         |
| 轮询卡住或重连缓慢                    | 用 `openclaw logs --follow` 查看轮询诊断         | 升级；如果重启是假阳性，调整 `pollingStallThresholdMs`。持续卡住仍指向代理/DNS/IPv6 问题。                                  |
| 启动时 `setMyCommands` 被拒绝         | 检查日志中的 `BOT_COMMANDS_TOO_MUCH`             | 减少插件/技能/自定义 Telegram 命令，或禁用原生命令菜单。                                                                    |
| 升级后允许列表阻止你                  | `openclaw security audit` 和配置允许列表         | 运行 `openclaw doctor --fix`，或将 `@username` 替换为数字发送者 ID。                                                         |

完整故障排查：[Telegram 故障排查](/zh-CN/channels/telegram#troubleshooting)

## Discord

### Discord 故障特征

| 症状                                      | 最快检查                                                                                                                     | 修复                                                                                                                                                                                                                                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot 在线但没有服务器回复                  | `openclaw channels status --probe`                                                                                           | 允许服务器/频道，并验证消息内容意图。                                                                                                                                                                                                                                  |
| 群组消息被忽略                            | 检查日志中的提及门控丢弃                                                                                                     | 提及 Bot，或设置服务器/频道 `requireMention: false`。                                                                                                                                                                                                                  |
| 有输入状态/令牌使用但没有 Discord 消息    | 检查这是环境房间事件，还是已选择加入的 `message_tool` 房间中模型漏掉了 `message(action=send)`                                | 检查 Gateway 网关详细日志中被抑制的最终载荷元数据，验证 `messages.groupChat.unmentionedInbound`，阅读 [环境房间事件](/zh-CN/channels/ambient-room-events)，或为普通群组请求保留 `messages.groupChat.visibleReplies: "automatic"`。 |
| 缺少私信回复                              | `openclaw pairing list discord`                                                                                              | 批准私信配对，或调整私信策略。                                                                                                                                                                                                                                         |

完整故障排查：[Discord 故障排查](/zh-CN/channels/discord#troubleshooting)

## Slack

### Slack 故障特征

| 症状                                  | 最快检查                                  | 修复                                                                                                                                                  |
| ------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode 已连接但没有响应          | `openclaw channels status --probe`        | 验证 app token + bot token 和所需权限范围；在基于 SecretRef 的设置中留意 `botTokenStatus` / `appTokenStatus = configured_unavailable`。               |
| 私信被阻止                            | `openclaw pairing list slack`             | 批准配对，或放宽私信策略。                                                                                                                           |
| 频道消息被忽略                        | 检查 `groupPolicy` 和频道允许列表         | 允许该频道，或将策略切换为 `open`。                                                                                                                   |

完整故障排查：[Slack 故障排查](/zh-CN/channels/slack#troubleshooting)

## iMessage

### iMessage 故障特征

| 症状                                  | 最快检查                                                | 修复                                                                  |
| ------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| `imsg` 缺失或在非 macOS 上失败        | `openclaw channels status --probe --channel imessage`   | 在 Messages Mac 上运行 OpenClaw，或为 `cliPath` 使用 SSH 包装器。     |
| 在 macOS 上可以发送但不能接收         | 检查 Messages 自动化的 macOS 隐私权限                   | 重新授予 TCC 权限，并重启渠道进程。                                   |
| 私信发送者被阻止                      | `openclaw pairing list imessage`                        | 批准配对，或更新允许列表。                                            |

完整故障排查：[iMessage 故障排查](/zh-CN/channels/imessage#troubleshooting)

## Signal

### Signal 故障特征

| 症状                         | 最快检查                                   | 修复                                                     |
| ---------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| 守护进程可访问但 Bot 静默    | `openclaw channels status --probe`         | 验证 `signal-cli` 守护进程 URL/账号和接收模式。         |
| 私信被阻止                   | `openclaw pairing list signal`             | 批准发送者，或调整私信策略。                             |
| 群组回复未触发               | 检查群组允许列表和提及模式                 | 添加发送者/群组，或放宽门控。                            |

完整故障排查：[Signal 故障排查](/zh-CN/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot 故障特征

| 症状                              | 最快检查                                    | 修复                                                            |
| --------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| Bot 回复 “gone to Mars”           | 验证配置中的 `appId` 和 `clientSecret`      | 设置凭据或重启 Gateway 网关。                                  |
| 没有入站消息                      | `openclaw channels status --probe`          | 在 QQ Open Platform 上验证凭据。                               |
| 语音未转写                        | 检查 STT 提供商配置                         | 配置 `channels.qqbot.stt` 或 `tools.media.audio`。              |
| 主动消息未到达                    | 检查 QQ 平台交互要求                        | 如果近期没有交互，QQ 可能会阻止 Bot 发起的消息。               |

完整故障排查：[QQ Bot 故障排查](/zh-CN/channels/qqbot#troubleshooting)

## Matrix

### Matrix 失败特征

| 症状                                | 最快检查                               | 修复                                                                      |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| 已登录但忽略房间消息                | `openclaw channels status --probe`     | 检查 `groupPolicy`、房间允许列表和提及门控。                              |
| 私信不处理                          | `openclaw pairing list matrix`         | 批准发送者或调整私信策略。                                                |
| 加密房间失败                        | `openclaw matrix verify status`        | 重新验证设备，然后检查 `openclaw matrix verify backup status`。           |
| 备份恢复处于待处理/损坏状态         | `openclaw matrix verify backup status` | 运行 `openclaw matrix verify backup restore`，或使用恢复密钥重新运行。    |
| 交叉签名/引导状态不正确             | `openclaw matrix verify bootstrap`     | 一次性修复秘密存储、交叉签名和备份状态。                                  |

完整设置和配置：[Matrix](/zh-CN/channels/matrix)

## 相关

- [配对](/zh-CN/channels/pairing)
- [渠道路由](/zh-CN/channels/channel-routing)
- [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting)
