---
read_when:
    - 渠道传输显示已连接，但回复失败
    - 深入阅读提供商文档之前，你需要先进行渠道特定检查
summary: 按渠道快速排查故障，提供各渠道的故障特征和修复方法
title: 渠道故障排查
x-i18n:
    generated_at: "2026-07-11T20:21:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2699b48ed6ab1f702789d2180daa43aed6ee83023889d0d8821faceb9a943b5
    source_path: channels/troubleshooting.md
    workflow: 16
---

当渠道已连接但行为异常时，请使用此页面。

## 命令排查顺序

首先按顺序运行以下命令：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

正常基准：

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`、`write-capable` 或 `admin-capable`
- 渠道探测显示传输连接正常，并在支持的情况下显示 `works` 或 `audit ok`

## 更新后

更新后，如果 Telegram、iMessage、BlueBubbles 时代的配置或其他插件渠道消失，请执行以下操作。

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

在 `openclaw status --all` 中查找 `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`。这表示渠道已配置，但插件设置或加载遇到了损坏的依赖树，因而未能注册渠道。`openclaw doctor --fix` 会清除过期的插件运行时依赖符号链接和过期的身份验证影子配置，然后 `openclaw gateway restart` 会重新加载干净状态。

## WhatsApp

### WhatsApp 故障特征

| 症状 | 最快检查方法 | 修复方法 |
| ----------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 已连接但不回复私信 | `openclaw pairing list whatsapp` | 批准发送者，或更改私信策略/允许列表。 |
| 忽略群组消息 | 检查配置中的 `requireMention` 和提及模式 | 提及机器人，或放宽该群组的提及策略。 |
| 二维码登录因 408 超时 | 检查 Gateway 网关的 `HTTPS_PROXY` / `HTTP_PROXY` 环境变量 | 设置可访问的代理；仅将 `NO_PROXY` 用于绕过代理。 |
| 随机断开连接/反复重新登录 | `openclaw channels status --probe` 和日志 | 即使当前已连接，近期的重新连接也会被标记；观察日志、重启 Gateway 网关，如果连接仍反复波动，则重新关联。 |
| 反复出现 `status=408 Request Time-out` | 依次执行探测、查看日志、运行 Doctor，然后检查 Gateway 网关状态 | 先修复主机连接或时序问题；如果循环仍然存在，请备份身份验证数据并重新关联账号。 |
| 回复延迟数秒或数分钟 | `openclaw doctor --fix` | 当确认过期的本地 TUI 客户端正在降低 Gateway 网关事件循环的性能时，Doctor 会将其停止。 |

完整故障排查：[WhatsApp 故障排查](/zh-CN/channels/whatsapp#troubleshooting)

## Telegram

### Telegram 故障特征

| 症状 | 最快检查方法 | 修复方法 |
| ------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| 执行 `/start` 后没有可用的回复流程 | `openclaw pairing list telegram` | 批准配对或更改私信策略。 |
| 机器人在线但群组中保持沉默 | 验证提及要求和机器人隐私模式 | 禁用隐私模式以使机器人可见群组消息，或提及机器人。 |
| 发送失败并出现网络错误 | 检查日志中的 Telegram API 调用失败 | 修复前往 `api.telegram.org` 的 DNS、IPv6 或代理路由。 |
| 启动时报告 `getMe returned 401` | 检查配置的令牌来源 | 重新复制或生成 BotFather 令牌，并更新 `botToken`、`tokenFile` 或默认账号的 `TELEGRAM_BOT_TOKEN`。 |
| 轮询停滞或重新连接缓慢 | 通过 `openclaw logs --follow` 查看轮询诊断信息 | 升级；如果重启属于误报，请调整 `pollingStallThresholdMs`。持续停滞仍表明代理、DNS 或 IPv6 存在问题。 |
| 启动时拒绝 `setMyCommands` | 检查日志中的 `BOT_COMMANDS_TOO_MUCH` | 减少插件、技能或自定义 Telegram 命令，或禁用原生菜单。 |
| 升级后允许列表将你拦截 | `openclaw security audit` 和配置中的允许列表 | 运行 `openclaw doctor --fix`，或将 `@username` 替换为数字发送者 ID。 |

完整故障排查：[Telegram 故障排查](/zh-CN/channels/telegram#troubleshooting)

## Discord

### Discord 故障特征

| 症状 | 最快检查方法 | 修复方法 |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 机器人在线但不回复服务器消息 | `openclaw channels status --probe` | 允许该服务器/频道，并验证消息内容意图。 |
| 忽略群组消息 | 检查日志中因提及门控而丢弃消息的记录 | 提及机器人，或将服务器/频道的 `requireMention` 设为 `false`。 |
| 有正在输入状态/令牌用量，但没有 Discord 消息 | 检查这是否为环境房间事件，或已选择启用 `message_tool` 但模型未调用 `message(action=send)` 的房间 | 检查 Gateway 网关详细日志中的最终负载抑制元数据，验证 `messages.groupChat.unmentionedInbound`，阅读[环境房间事件](/zh-CN/channels/ambient-room-events)，或为普通群组请求保留 `messages.groupChat.visibleReplies: "automatic"`。 |
| 缺少私信回复 | `openclaw pairing list discord` | 批准私信配对或调整私信策略。 |

完整故障排查：[Discord 故障排查](/zh-CN/channels/discord#troubleshooting)

## Slack

### Slack 故障特征

| 症状 | 最快检查方法 | 修复方法 |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket 模式已连接但没有响应 | `openclaw channels status --probe` | 验证应用令牌、机器人令牌和所需权限范围；对于由 SecretRef 支持的设置，留意 `botTokenStatus` / `appTokenStatus = configured_unavailable`。 |
| 私信被阻止 | `openclaw pairing list slack` | 批准配对或放宽私信策略。 |
| 频道消息被忽略 | 检查 `groupPolicy` 和频道允许列表 | 允许该频道，或将策略切换为 `open`。 |

完整故障排查：[Slack 故障排查](/zh-CN/channels/slack#troubleshooting)

## iMessage

### iMessage 故障特征

| 症状 | 最快检查方法 | 修复方法 |
| ------------------------------------ | ------------------------------------------------------- | --------------------------------------------------------------------- |
| 非 macOS 系统中缺少 `imsg` 或无法运行 | `openclaw channels status --probe --channel imessage` | 在运行“信息”的 Mac 上运行 OpenClaw，或为 `cliPath` 使用 SSH 包装器。 |
| 在 macOS 上可以发送但无法接收 | 检查 macOS 中“信息”自动化的隐私权限 | 重新授予 TCC 权限并重启渠道进程。 |
| 私信发送者被阻止 | `openclaw pairing list imessage` | 批准配对或更新允许列表。 |

完整故障排查：[iMessage 故障排查](/zh-CN/channels/imessage#troubleshooting)

## Signal

### Signal 故障特征

| 症状 | 最快检查方法 | 修复方法 |
| ------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| 守护进程可访问但机器人无响应 | `openclaw channels status --probe` | 验证 `signal-cli` 守护进程 URL/账号和接收模式。 |
| 私信被阻止 | `openclaw pairing list signal` | 批准发送者或调整私信策略。 |
| 群组回复未触发 | 检查群组允许列表和提及模式 | 添加发送者/群组，或放宽门控条件。 |

完整故障排查：[Signal 故障排查](/zh-CN/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot 故障特征

| 症状 | 最快检查方法 | 修复方法 |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| 机器人回复“去了火星” | 验证配置中的 `appId` 和 `clientSecret` | 设置凭据或重启 Gateway 网关。 |
| 没有入站消息 | `openclaw channels status --probe` | 验证 QQ 开放平台上的凭据。 |
| 语音未转写 | 检查 STT 提供商配置 | 配置 `channels.qqbot.stt` 或 `tools.media.audio`。 |
| 主动消息未送达 | 检查 QQ 平台的交互要求 | 如果近期没有交互，QQ 可能会阻止机器人主动发起的消息。 |

完整故障排查：[QQ Bot 故障排查](/zh-CN/channels/qqbot#troubleshooting)

## Matrix

### Matrix 故障特征

| 症状 | 最快检查方式 | 修复方法 |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| 已登录但忽略房间消息 | `openclaw channels status --probe` | 检查 `groupPolicy`、房间允许列表和提及门控。 |
| 私信未被处理 | `openclaw pairing list matrix` | 批准发送者或调整私信策略。 |
| 加密房间无法使用 | `openclaw matrix verify status` | 重新验证设备，然后检查 `openclaw matrix verify backup status`。 |
| 备份恢复处于待处理状态或已损坏 | `openclaw matrix verify backup status` | 运行 `openclaw matrix verify backup restore`，或使用恢复密钥重新运行。 |
| 交叉签名/引导状态看起来不正确 | `openclaw matrix verify bootstrap` | 一次性修复秘密存储、交叉签名和备份状态。 |

完整设置和配置：[Matrix](/zh-CN/channels/matrix)

## 相关内容

- [配对](/zh-CN/channels/pairing)
- [渠道路由](/zh-CN/channels/channel-routing)
- [Gateway 网关故障排查](/zh-CN/gateway/troubleshooting)
