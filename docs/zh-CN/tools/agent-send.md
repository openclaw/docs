---
read_when:
    - 你想从脚本或命令行触发智能体运行
    - 你需要以编程方式将智能体回复发送到聊天渠道
summary: 从 CLI 运行智能体轮次，并可选择将回复发送到渠道
title: 智能体发送
x-i18n:
    generated_at: "2026-06-27T03:23:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 25026258a5a47c87fbf99689de5ea16d827b11af07bc5ce4f6c3e2bda6466b46
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` 从命令行运行单个智能体轮次，不需要
传入的聊天消息。可将它用于脚本化工作流、测试和
程序化投递。

## 快速开始

<Steps>
  <Step title="运行一个简单的智能体轮次">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    这会通过 Gateway 网关发送消息并打印回复。

  </Step>

  <Step title="从文件发送多行提示">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    这会将有效的 UTF-8 文件读取为智能体消息正文。

  </Step>

  <Step title="指定特定智能体或会话">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"

    # Target an exact session key
    openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
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
| `--message \<text\>`          | 要发送的内联消息                                      |
| `--message-file \<path\>`     | 从有效的 UTF-8 文件读取消息                    |
| `--to \<dest\>`               | 从目标（电话号码、聊天 ID）派生会话键           |
| `--session-key \<key\>`       | 使用显式会话键                                 |
| `--agent \<id\>`              | 指定已配置的智能体（使用其 `main` 会话）         |
| `--session-id \<id\>`         | 按 ID 复用现有会话                             |
| `--local`                     | 强制使用本地嵌入式运行时（跳过 Gateway 网关）                 |
| `--deliver`                   | 将回复发送到聊天渠道                            |
| `--channel \<name\>`          | 投递渠道（whatsapp、telegram、discord、slack 等） |
| `--reply-to \<target\>`       | 投递目标覆盖                                    |
| `--reply-channel \<name\>`    | 投递渠道覆盖                                   |
| `--reply-account \<id\>`      | 投递账户 ID 覆盖                                |
| `--thinking \<level\>`        | 为所选模型配置文件设置思考级别           |
| `--verbose \<on\|full\|off\>` | 设置详细程度                                           |
| `--timeout \<seconds\>`       | 覆盖智能体超时时间                                      |
| `--json`                      | 输出结构化 JSON                                      |

## 行为

- 默认情况下，CLI 会**通过 Gateway 网关**。添加 `--local` 可强制使用
  当前机器上的嵌入式运行时。
- 仅传入 `--message` 或 `--message-file` 其中之一。文件消息会在移除可选的 UTF-8 BOM 后保留
  多行内容。
- 如果无法访问 Gateway 网关，CLI 会**回退**到本地嵌入式运行。
- 会话选择：`--to` 会派生会话键（群组/渠道目标
  保持隔离；直接聊天会折叠到 `main`）。
- `--session-key` 选择显式键。带智能体前缀的键必须使用
  `agent:<agent-id>:<session-key>`，并且当同时提供 `--agent` 时，它必须匹配该智能体 ID。
  裸的非哨兵键在提供 `--agent` 时会限定到 `--agent`；
  例如，`--agent ops --session-key incident-42` 会路由到
  `agent:ops:incident-42`。没有 `--agent` 时，裸的非哨兵键会限定到
  已配置的默认智能体。字面值 `global` 和 `unknown` 只有在未提供
  `--agent` 时才保持不限定；在这种情况下，嵌入式回退
  和存储所有权会使用已配置的默认智能体。
- 思考和详细程度标志会持久化到会话存储。
- 输出：默认是纯文本，或使用 `--json` 输出结构化载荷 + 元数据。
- 使用 `--json --deliver` 时，JSON 会包含已发送、已抑制、
  部分发送和发送失败的投递状态。参见
  [JSON 投递状态](/zh-CN/cli/agent#json-delivery-status)。

## 示例

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Multiline prompt from a file
openclaw agent --agent ops --message-file ./task.md

# Exact session key
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"

# Legacy key scoped to an agent
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## 相关内容

<CardGroup cols={2}>
  <Card title="智能体 CLI 参考" href="/zh-CN/cli/agent" icon="terminal">
    完整的 `openclaw agent` 标志和选项参考。
  </Card>
  <Card title="子智能体" href="/zh-CN/tools/subagents" icon="users">
    后台子智能体生成。
  </Card>
  <Card title="会话" href="/zh-CN/concepts/session" icon="comments">
    会话键如何工作，以及 `--to`、`--agent` 和 `--session-id` 如何解析它们。
  </Card>
  <Card title="斜杠命令" href="/zh-CN/tools/slash-commands" icon="slash">
    智能体会话内使用的原生命令目录。
  </Card>
</CardGroup>
