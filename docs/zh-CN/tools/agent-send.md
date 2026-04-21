---
read_when:
    - 你想要从脚本或命令行触发智能体运行
    - 你需要以编程方式将智能体回复发送到聊天渠道
summary: 从 CLI 运行智能体轮次，并可选择将回复发送到渠道
title: 智能体发送
x-i18n:
    generated_at: "2026-04-21T08:24:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0550ad38efb2711f267a62b905fd150987a98801247de780ed3df97f27245704
    source_path: tools/agent-send.md
    workflow: 15
---

# 智能体发送

`openclaw agent` 可在无需入站聊天消息的情况下，从命令行运行单个智能体轮次。可将其用于脚本化工作流、测试以及以编程方式进行发送。

## 快速开始

<Steps>
  <Step title="运行一个简单的智能体轮次">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    这会通过 Gateway 网关发送消息并打印回复。

  </Step>

  <Step title="指定特定智能体或会话">
    ```bash
    # 指定特定智能体
    openclaw agent --agent ops --message "Summarize logs"

    # 指定电话号码（派生会话键）
    openclaw agent --to +15555550123 --message "Status update"

    # 复用现有会话
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="将回复发送到渠道">
    ```bash
    # 发送到 WhatsApp（默认渠道）
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # 发送到 Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## 标志

| 标志                          | 说明                                                        |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | 要发送的消息（必需）                                        |
| `--to \<dest\>`               | 从目标（电话、聊天 id）派生会话键                           |
| `--agent \<id\>`              | 指定已配置的智能体（使用其 `main` 会话）                    |
| `--session-id \<id\>`         | 按 id 复用现有会话                                          |
| `--local`                     | 强制使用本地嵌入式运行时（跳过 Gateway 网关）               |
| `--deliver`                   | 将回复发送到聊天渠道                                        |
| `--channel \<name\>`          | 发送渠道（whatsapp、telegram、discord、slack 等）           |
| `--reply-to \<target\>`       | 覆盖发送目标                                                |
| `--reply-channel \<name\>`    | 覆盖发送渠道                                                |
| `--reply-account \<id\>`      | 覆盖发送账户 id                                             |
| `--thinking \<level\>`        | 为所选模型配置设置思考级别                                  |
| `--verbose \<on\|full\|off\>` | 设置详细级别                                                |
| `--timeout \<seconds\>`       | 覆盖智能体超时时间                                          |
| `--json`                      | 输出结构化 JSON                                             |

## 行为

- 默认情况下，CLI 会**通过 Gateway 网关**运行。添加 `--local` 可强制在当前机器上使用嵌入式本地运行时。
- 如果 Gateway 网关不可达，CLI 会**回退**到本地嵌入式运行。
- 会话选择：`--to` 会派生会话键（群组/渠道目标会保持隔离；私聊会折叠到 `main`）。
- thinking 和 verbose 标志会持久保存到会话存储中。
- 输出：默认是纯文本，或使用 `--json` 输出结构化负载 + 元数据。

## 示例

```bash
# 带 JSON 输出的简单轮次
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# 带 thinking 级别的轮次
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# 发送到与会话不同的渠道
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## 相关内容

- [智能体 CLI 参考](/cli/agent)
- [子智能体](/zh-CN/tools/subagents) — 后台子智能体生成
- [会话](/zh-CN/concepts/session) — 会话键的工作方式
