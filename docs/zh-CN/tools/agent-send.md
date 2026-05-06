---
read_when:
    - 你想从脚本或命令行触发智能体运行
    - 你需要以编程方式将智能体回复发送到聊天渠道
summary: 从 CLI 运行智能体轮次，并可选择将回复发送到渠道
title: 智能体发送
x-i18n:
    generated_at: "2026-05-06T01:18:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1339ebd74e2349669942ff93f200b53a69ad05f2186d6ff76437c779f312a291
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` 从命令行运行单个智能体轮次，无需收到入站聊天消息。可用于脚本化工作流、测试和程序化投递。

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
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="将回复投递到渠道">
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

| 标志                          | 描述                                                 |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | 要发送的消息（必填）                                  |
| `--to \<dest\>`               | 从目标（电话号码、聊天 ID）派生会话键           |
| `--agent \<id\>`              | 指定已配置的智能体（使用其 `main` 会话）         |
| `--session-id \<id\>`         | 按 ID 复用现有会话                             |
| `--local`                     | 强制使用本地嵌入式运行时（跳过 Gateway 网关）                 |
| `--deliver`                   | 将回复发送到聊天渠道                            |
| `--channel \<name\>`          | 投递渠道（whatsapp、telegram、discord、slack 等） |
| `--reply-to \<target\>`       | 投递目标覆盖                                    |
| `--reply-channel \<name\>`    | 投递渠道覆盖                                   |
| `--reply-account \<id\>`      | 投递账号 ID 覆盖                                |
| `--thinking \<level\>`        | 为所选模型配置文件设置思考级别           |
| `--verbose \<on\|full\|off\>` | 设置详细输出级别                                           |
| `--timeout \<seconds\>`       | 覆盖智能体超时时间                                      |
| `--json`                      | 输出结构化 JSON                                      |

## 行为

- 默认情况下，CLI 会**通过 Gateway 网关**。添加 `--local` 可强制在当前机器上使用嵌入式运行时。
- 如果 Gateway 网关不可达，CLI 会**回退**到本地嵌入式运行。
- 会话选择：`--to` 会派生会话键（群组/渠道目标会保持隔离；直接聊天会折叠到 `main`）。
- 思考和详细输出标志会持久化到会话存储中。
- 输出：默认是纯文本，或使用 `--json` 输出结构化载荷 + 元数据。

## 示例

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## 相关

<CardGroup cols={2}>
  <Card title="智能体 CLI 参考" href="/zh-CN/cli/agent" icon="terminal">
    完整的 `openclaw agent` 标志和选项参考。
  </Card>
  <Card title="子智能体" href="/zh-CN/tools/subagents" icon="users">
    后台子智能体生成。
  </Card>
  <Card title="会话" href="/zh-CN/concepts/session" icon="comments">
    会话键的工作方式，以及 `--to`、`--agent` 和 `--session-id` 如何解析它们。
  </Card>
  <Card title="斜杠命令" href="/zh-CN/tools/slash-commands" icon="slash">
    智能体会话中使用的原生命令目录。
  </Card>
</CardGroup>
