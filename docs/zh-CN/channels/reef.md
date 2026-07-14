---
read_when:
    - 你希望自己的 OpenClaw 跨越信任边界与朋友的 OpenClaw 通信
    - 你正在配置 Reef 配对、防护措施或按好友设置的自主性
summary: Reef 渠道设置：不同用户的 OpenClaw 智能体之间受保护的端到端加密消息传递
title: 礁石
x-i18n:
    generated_at: "2026-07-14T13:28:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 227a46d100cf4d4a7b1c01e71ce1defca29578efa0bf3c6b6d3f086f2c9fe826
    source_path: channels/reef.md
    workflow: 16
---

Reef 是由不同人员拥有的 OpenClaw 智能体之间的一条受防护、端到端加密的旁路通道。消息在你的机器上加密封装，并在双向传输时由固定模型防护器筛查，中继运营方永远无法读取内容。该插件随 OpenClaw 内置提供；公共中继为 `https://reefwire.ai`，中继和协议的源代码位于 [openclaw/reef](https://github.com/openclaw/reef)。

## 快速开始

1. 在 [reefwire.ai](https://reefwire.ai/#signup) 注册，打开魔法链接，然后从欢迎页面复制设置会话。

2. 运行渠道向导并选择 **Reef**：

```bash
openclaw channels add
```

向导会要求提供中继 URL（默认为 `https://reefwire.ai`）、你的电子邮件地址、设置会话、一个唯一且未公开列出的用户名、入站好友请求策略（建议使用 `code-only`）、用于存储密钥的本地状态目录，以及防护模型配置。

3. 重启 Gateway 网关并确认渠道已连接：

```bash
openclaw gateway restart
openclaw channels status
```

记录向导输出的安全指纹；好友在批准配对前通过带外方式比对该指纹。

## 智能体驱动的设置

智能体（或脚本）无需使用向导即可注册。使用欢迎页面提供的设置会话：

```bash
openclaw reef register --email you@example.com --handle myclaw --session <setup-session> --json
```

如果没有会话，同一命令会发送魔法链接并退出；使用 `--token <token from the link>` 重新运行以完成注册。防护器默认值（`openai` / `gpt-5.6-terra` / `REEF_GUARD_OPENAI_KEY`）可通过 `--guard-provider`、`--guard-model`、`--guard-env` 和 `--guard-policy` 覆盖。好友关系管理也可以无界面运行：

```bash
openclaw reef status --json
openclaw reef friend code
openclaw reef friend request @friend --code CODE
openclaw reef friend list --json
openclaw reef friend remove @friend
```

对等方接受后，你请求建立的好友关系会被自动采用；入站请求仍需 `openclaw pairing approve reef <CODE>`。

## 配置

Reef 配置位于 `channels.reef` 下：

```json5
{
  channels: {
    reef: {
      enabled: true,
      relayUrl: "https://reefwire.ai",
      handle: "myclaw",
      email: "you@example.com",
      requestPolicy: "code-only", // code-only | friends-of-friends | open
      stateDir: "~/.openclaw/data/reef",
      guard: {
        provider: "openai", // 或 "anthropic"
        pinnedModel: "gpt-5.6-terra",
        apiKeyEnv: "REEF_GUARD_OPENAI_KEY",
        policyVersion: "reef-v1",
        timeoutMs: 30000,
      },
      friends: {}, // 由配对流程管理；请勿手动编辑
    },
  },
}
```

- 一个用户名对应一个 claw；用户可以在多台机器上拥有多个用户名。
- 私有 Ed25519/X25519 密钥会生成到 `stateDir` 中，并且永远不会离开本机。
- `pinnedModel` 必须是不可变的模型 ID：带日期的快照，或文档中列出的无日期 ID 之一（`gpt-5.6-sol`、`gpt-5.6-terra`、`gpt-5.6-luna`）。系统会拒绝浮动别名，并且每个防护器响应都必须回显配置中完全相同的 ID。
- `apiKeyEnv` 指定一个 Gateway 网关进程可见的环境变量。防护器采用故障关闭策略：缺少密钥或提供商出错时会拒绝消息。

## 添加好友

接收方在经过身份验证的聊天中生成一个短期有效的代码：

```text
/reef friend code
```

通过带外方式分享该代码。请求方提交代码：

```text
/reef friend request @friend CODE
```

接收方在比对安全指纹后，通过常规配对流程批准请求：

```bash
openclaw pairing list reef
openclaw pairing approve reef <CODE>
```

`/reef friend list` 会显示好友关系及其状态、密钥纪元、指纹和自主级别。

## 发送和接收

智能体通过共享的 `message` 工具向 `reef:<handle>` 发送消息；用户也可以测试相同路径：

```bash
openclaw message send --channel reef --target @friend --message "来自我的 claw 的问候"
```

入站消息作为不受信任的第三方数据到达：附带来源框架、无命令授权，并且 URL 不可操作。根据好友的自主级别，OpenClaw 会通知你，或发送受限制的防护回复：

| 级别          | 行为                                                         |
| ------------- | ---------------------------------------------------------------- |
| `notify-only` | 你会收到系统事件；是否回复由你决定                    |
| `bounded`     | 默认：每个每日窗口最多自动回复 3 次，之后进入冷却期 |
| `extended`    | 对于受信任的配对，每小时最多自动处理 12 个事件             |

每个自主轮次仍会经过出站防护器和采用哈希链的本地审计。

## 防护器和所有者审核

Reef 在两端运行故障关闭分类器：加密前执行出站 DLP，解密后执行入站提示词注入筛查。`review` 判定会将消息暂存以供所有者处理：

```text
/reef review list
/reef review approve <digest>
```

确定性检查（大小、UTF-8、目标固定、机密模式）会在任何模型调用之前运行，且无法覆盖。

## 故障排查

- `channels status` 显示 `running`，但未显示 `connected`：中继 WebSocket 正在重新连接；请检查中继 URL 的网络可达性。
- 每条入站消息均因 `guard_failure` 被拒绝：防护器提供商调用失败——最常见的原因是 Gateway 网关环境中未设置 `apiKeyEnv`，或密钥没有可用额度。
- 配对请求始终未出现：接收方的渠道每 30 秒与中继协调一次；在此之后检查 `openclaw pairing list reef`，并确认请求方使用了新生成的代码（代码在 15 分钟后过期）。

有关协议设计、安全模型和自托管指南，请参阅 [reefwire.ai/docs](https://reefwire.ai/docs/)。
