---
read_when:
    - 你想从脚本或命令行触发智能体运行
    - 你需要以编程方式将智能体回复投递到聊天渠道
summary: 从 CLI 运行智能体回合，并可选择将回复投递到渠道
title: 智能体发送
x-i18n:
    generated_at: "2026-04-05T10:10:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42ea2977e89fb28d2afd07e5f6b1560ad627aea8b72fde36d8e324215c710afc
    source_path: tools/agent-send.md
    workflow: 15
---

# 智能体发送

`openclaw agent` 可从命令行运行单个智能体回合，而无需入站聊天消息。你可以将它用于脚本化工作流、测试和程序化投递。

## 快速开始

<Steps>
  <Step title="运行一个简单的智能体回合">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    这会通过 Gateway 网关发送消息并打印回复。

  </Step>

  <Step title="指定特定智能体或会话">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="将回复投递到某个渠道">
    ```bash
    # Deliver to WhatsApp (default channel)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Deliver to Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## 标志

| 标志 | 说明 |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>` | 要发送的消息（必需） |
| `--to \<dest\>` | 从目标派生会话键（电话号码、聊天 id） |
| `--agent \<id\>` | 指定已配置的智能体（使用其 `main` 会话） |
| `--session-id \<id\>` | 通过 id 复用现有会话 |
| `--local` | 强制使用本地嵌入式运行时（跳过 Gateway 网关） |
| `--deliver` | 将回复发送到聊天渠道 |
| `--channel \<name\>` | 投递渠道（whatsapp、telegram、discord、slack 等） |
| `--reply-to \<target\>` | 覆盖投递目标 |
| `--reply-channel \<name\>` | 覆盖投递渠道 |
| `--reply-account \<id\>` | 覆盖投递账号 id |
| `--thinking \<level\>` | 设置 thinking 级别（off、minimal、low、medium、high、xhigh） |
| `--verbose \<on\|full\|off\>` | 设置 verbose 级别 |
| `--timeout \<seconds\>` | 覆盖智能体超时时间 |
| `--json` | 输出结构化 JSON |

## 行为

- 默认情况下，CLI 会 **通过 Gateway 网关** 运行。添加 `--local` 可强制使用当前机器上的嵌入式运行时。
- 如果 Gateway 网关不可达，CLI 会 **回退** 到本地嵌入式运行。
- 会话选择：`--to` 会派生会话键（群组/渠道目标会保留隔离；私聊会折叠为 `main`）。
- Thinking 和 verbose 标志会持久化到会话存储中。
- 输出：默认是纯文本，或使用 `--json` 输出结构化负载 + 元数据。

## 示例

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## 相关内容

- [智能体 CLI 参考](/cli/agent)
- [子智能体](/zh-CN/tools/subagents) — 后台子智能体生成
- [会话](/zh-CN/concepts/session) — 会话键的工作方式
