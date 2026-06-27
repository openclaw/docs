---
read_when:
    - 渠道传输显示已连接，但回复失败
    - 你需要在深入提供商文档之前进行渠道特定检查
summary: 按渠道故障特征和修复方案进行快速渠道级故障排除
title: 渠道故障排除
x-i18n:
    generated_at: "2026-06-27T01:27:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 56b64030ec56553b4c2e156195806029f91bc8cc449588a242b0f45f8bbddb6e
    source_path: channels/troubleshooting.md
    workflow: 16
---

当渠道已连接但行为不正确时，请使用此页面。

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
- 渠道探测显示传输已连接，并且在支持的情况下显示 `works` 或 `audit ok`

## 更新后

当 Telegram、iMessage、BlueBubbles 时代的配置或另一个插件
渠道在更新后消失时，请使用此流程。

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

在 `openclaw status --all` 中查找 `plugin load failed: dependency tree corrupted; run openclaw doctor
--fix`。这表示渠道已配置，但
插件设置/加载路径遇到了损坏的依赖树，而不是注册
该渠道。`openclaw doctor --fix` 会移除陈旧的插件依赖暂存
目录和陈旧的凭证影子，然后 `openclaw gateway restart` 会重新加载
干净状态。

## WhatsApp

### WhatsApp 失败特征

| 症状                                | 最快检查                                            | 修复                                                                                                                               |
| ----------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 已连接但没有私信回复                | `openclaw pairing list whatsapp`                    | 批准发送者或切换私信策略/允许列表。                                                                                               |
| 群组消息被忽略                      | 检查配置中的 `requireMention` + 提及模式            | 提及 Bot 或放宽该群组的提及策略。                                                                                                  |
| 二维码登录因 408 超时               | 检查 Gateway 网关的 `HTTPS_PROXY` / `HTTP_PROXY` 环境变量 | 设置可访问的代理；仅将 `NO_PROXY` 用于绕过。                                                                                       |
| 随机断开连接/重新登录循环          | `openclaw channels status --probe` + 日志           | 即使当前已连接，近期重连也会被标记；观察日志，重启 Gateway 网关，如果抖动继续则重新链接。                                        |
| `status=408 Request Time-out` 循环  | 探测、日志、Doctor，然后检查 Gateway 网关状态       | 先修复主机连通性/时序；如果循环持续，请备份凭证并重新链接账号。                                                                   |
| 回复延迟数秒/数分钟到达             | `openclaw doctor --fix`                             | Doctor 会停止已验证为陈旧的本地 TUI 客户端，因为它们正在拖慢 Gateway 网关事件循环。                                               |

完整故障排除：[WhatsApp 故障排除](/zh-CN/channels/whatsapp#troubleshooting)

## Telegram

### Telegram 失败特征

| 症状                                  | 最快检查                                         | 修复                                                                                                                         |
| ------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `/start` 后没有可用的回复流程         | `openclaw pairing list telegram`                 | 批准配对或更改私信策略。                                                                                                     |
| Bot 在线但群组保持沉默                | 验证提及要求和 Bot 隐私模式                      | 禁用隐私模式以获得群组可见性，或提及 Bot。                                                                                   |
| 发送失败并出现网络错误                | 检查日志中的 Telegram API 调用失败               | 修复到 `api.telegram.org` 的 DNS/IPv6/代理路由。                                                                             |
| 启动报告 `getMe returned 401`         | 检查配置的令牌来源                               | 重新复制或重新生成 BotFather 令牌，并更新 `botToken`、`tokenFile` 或默认账号 `TELEGRAM_BOT_TOKEN`。                         |
| 轮询卡住或重连缓慢                    | 使用 `openclaw logs --follow` 查看轮询诊断       | 升级；如果重启是假阳性，请调优 `pollingStallThresholdMs`。持续卡住仍然指向代理/DNS/IPv6 问题。                              |
| 启动时 `setMyCommands` 被拒绝         | 检查日志中的 `BOT_COMMANDS_TOO_MUCH`             | 减少插件/Skill/自定义 Telegram 命令，或禁用原生命令菜单。                                                                    |
| 升级后允许列表阻止你                  | `openclaw security audit` 和配置允许列表         | 运行 `openclaw doctor --fix`，或将 `@username` 替换为数字发送者 ID。                                                         |

完整故障排除：[Telegram 故障排除](/zh-CN/channels/telegram#troubleshooting)

## Discord

### Discord 失败特征

| 症状                                      | 最快检查                                                                                                                     | 修复                                                                                                                                                                                                                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot 在线但没有服务器回复                  | `openclaw channels status --probe`                                                                                           | 允许服务器/频道并验证消息内容 intent。                                                                                                                                                                                                                               |
| 群组消息被忽略                            | 检查日志中的提及门控丢弃                                                                                                     | 提及 Bot 或设置服务器/频道 `requireMention: false`。                                                                                                                                                                                                                 |
| 有输入中/令牌用量但没有 Discord 消息      | 检查这是否是环境房间事件，或是已选择加入的 `message_tool` 房间且模型漏掉了 `message(action=send)`                            | 检查 Gateway 网关详细日志中的被抑制最终载荷元数据，验证 `messages.groupChat.unmentionedInbound`，阅读[环境房间事件](/zh-CN/channels/ambient-room-events)，或为普通群组请求保留 `messages.groupChat.visibleReplies: "automatic"`。 |
| 私信回复缺失                              | `openclaw pairing list discord`                                                                                              | 批准私信配对或调整私信策略。                                                                                                                                                                                                                                         |

完整故障排除：[Discord 故障排除](/zh-CN/channels/discord#troubleshooting)

## Slack

### Slack 失败特征

| 症状                                  | 最快检查                                  | 修复                                                                                                                                                 |
| ------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket 模式已连接但无响应             | `openclaw channels status --probe`        | 验证 app 令牌 + Bot 令牌和所需 scope；在基于 SecretRef 的设置中注意 `botTokenStatus` / `appTokenStatus = configured_unavailable`。                   |
| 私信被阻止                            | `openclaw pairing list slack`             | 批准配对或放宽私信策略。                                                                                                                             |
| 频道消息被忽略                        | 检查 `groupPolicy` 和频道允许列表         | 允许该频道或将策略切换为 `open`。                                                                                                                    |

完整故障排除：[Slack 故障排除](/zh-CN/channels/slack#troubleshooting)

## iMessage

### iMessage 失败特征

| 症状                                  | 最快检查                                                | 修复                                                                 |
| ------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------- |
| `imsg` 缺失或在非 macOS 上失败        | `openclaw channels status --probe --channel imessage`   | 在 Messages Mac 上运行 OpenClaw，或为 `cliPath` 使用 SSH 包装器。   |
| 在 macOS 上可以发送但无法接收         | 检查 macOS 对 Messages 自动化的隐私权限                 | 重新授予 TCC 权限并重启渠道进程。                                    |
| 私信发送者被阻止                      | `openclaw pairing list imessage`                        | 批准配对或更新允许列表。                                             |

完整故障排除：

- [iMessage 故障排除](/zh-CN/channels/imessage#troubleshooting)

## Signal

### Signal 失败特征

| 症状                          | 最快检查                                   | 修复                                                     |
| ----------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| 守护进程可访问但 Bot 沉默     | `openclaw channels status --probe`         | 验证 `signal-cli` 守护进程 URL/账号和接收模式。         |
| 私信被阻止                    | `openclaw pairing list signal`             | 批准发送者或调整私信策略。                               |
| 群组回复未触发                | 检查群组允许列表和提及模式                 | 添加发送者/群组或放宽门控。                              |

完整故障排除：[Signal 故障排除](/zh-CN/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot 失败特征

| 症状                              | 最快检查                                    | 修复                                                            |
| --------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| Bot 回复 “gone to Mars”           | 验证配置中的 `appId` 和 `clientSecret`      | 设置凭证或重启 Gateway 网关。                                  |
| 没有入站消息                      | `openclaw channels status --probe`          | 在 QQ 开放平台上验证凭证。                                      |
| 语音未转写                        | 检查 STT 提供商配置                         | 配置 `channels.qqbot.stt` 或 `tools.media.audio`。              |
| 主动消息未到达                    | 检查 QQ 平台交互要求                        | 如果近期没有交互，QQ 可能会阻止 Bot 发起的消息。                |

完整故障排除：[QQ Bot 故障排除](/zh-CN/channels/qqbot#troubleshooting)

## Matrix

### Matrix 失败特征

| 症状                             | 最快检查                               | 修复方法                                                                  |
| -------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| 已登录但忽略房间消息             | `openclaw channels status --probe`     | 检查 `groupPolicy`、房间允许列表和提及门控。                              |
| 私信未处理                       | `openclaw pairing list matrix`         | 批准发送者或调整私信策略。                                                |
| 加密房间失败                     | `openclaw matrix verify status`        | 重新验证设备，然后检查 `openclaw matrix verify backup status`。           |
| 备份恢复处于待处理/损坏状态      | `openclaw matrix verify backup status` | 运行 `openclaw matrix verify backup restore`，或使用恢复密钥重新运行。    |
| 交叉签名/引导看起来不正确        | `openclaw matrix verify bootstrap`     | 一次性修复密钥存储、交叉签名和备份状态。                                  |

完整设置和配置：[Matrix](/zh-CN/channels/matrix)

## 相关

- [配对](/zh-CN/channels/pairing)
- [频道路由](/zh-CN/channels/channel-routing)
- [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting)
