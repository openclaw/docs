---
read_when:
    - 你想通过脚本或命令行触发智能体运行
    - 你需要以编程方式将智能体回复发送到聊天渠道
summary: 从 CLI 运行智能体轮次，并可选择将回复发送到渠道
title: 智能体发送
x-i18n:
    generated_at: "2026-07-12T14:46:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 23ad57735bd43a2bba5add571e9572da0fbe7b516a70515c674e1ababaab081a
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` 可直接从命令行运行单个智能体轮次，无需接收入站聊天消息。它适用于脚本化工作流、测试和程序化交付。完整的标志和行为参考：
[Agent CLI 参考](/zh-CN/cli/agent)。

## 快速开始

<Steps>
  <Step title="运行一个简单的智能体轮次">
    ```bash
    openclaw agent --agent main --message "今天天气怎么样？"
    ```

    通过 Gateway 网关发送消息并打印回复。

  </Step>

  <Step title="从文件发送多行提示词">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    将有效的 UTF-8 文件内容读取为智能体消息正文。

  </Step>

  <Step title="指定特定智能体或会话">
    ```bash
    # 指定特定智能体
    openclaw agent --agent ops --message "总结日志"

    # 指定电话号码（派生会话键）
    openclaw agent --to +15555550123 --message "状态更新"

    # 复用现有会话
    openclaw agent --session-id abc123 --message "继续执行任务"

    # 指定确切的会话键
    openclaw agent --session-key agent:ops:incident-42 --message "总结状态"
    ```

  </Step>

  <Step title="将回复交付到渠道">
    ```bash
    # 交付到 WhatsApp（默认渠道）
    openclaw agent --to +15555550123 --message "报告已就绪" --deliver

    # 交付到 Slack
    openclaw agent --agent ops --message "生成报告" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## 标志

| 标志                        | 说明                                                          |
| --------------------------- | -------------------------------------------------------------------- |
| `--message <text>`          | 要发送的内联消息                                               |
| `--message-file <path>`     | 从有效的 UTF-8 文件读取消息                             |
| `--to <dest>`               | 根据目标（电话、聊天 ID）派生会话键                    |
| `--session-key <key>`       | 使用显式会话键                                          |
| `--agent <id>`              | 指定已配置的智能体（使用其 `main` 会话）                  |
| `--session-id <id>`         | 按 ID 复用现有会话                                      |
| `--model <id>`              | 覆盖本次运行的模型（`provider/model` 或模型 ID）           |
| `--local`                   | 强制使用本地嵌入式运行时（跳过 Gateway 网关）                          |
| `--deliver`                 | 将回复发送到聊天渠道                                     |
| `--channel <name>`          | 交付渠道；与 `--agent` + `--to` 一起使用时，也会应用私信作用域     |
| `--reply-to <target>`       | 覆盖交付目标                                             |
| `--reply-channel <name>`    | 覆盖交付渠道                                            |
| `--reply-account <id>`      | 覆盖交付账号 ID                                         |
| `--thinking <level>`        | 设置所选模型配置文件的思考级别                    |
| `--verbose <on\|full\|off>` | 为会话持久化详细级别（`full` 还会记录工具输出） |
| `--timeout <seconds>`       | 覆盖智能体超时时间（默认为 600 或配置值）                |
| `--json`                    | 输出结构化 JSON                                               |

## 行为

- 默认情况下，CLI **通过 Gateway 网关**运行。添加 `--local` 可强制使用当前机器上的嵌入式运行时。
- `--message` 和 `--message-file` 必须且只能传递其中一个。文件消息在移除可选的 UTF-8 BOM 后会保留多行内容。
- 如果 Gateway 网关请求失败，CLI 会**回退**到本地嵌入式运行；如果 Gateway 网关超时，则会使用全新会话回退，避免与原始记录产生竞态。
- 会话选择：`--to` 会派生会话键（群组/渠道目标保持隔离；直接聊天会归并到 `main`）。同时使用 `--agent`、`--channel` 和 `--to` 时，路由会遵循渠道的规范接收方和 `session.dmScope`。稳定的仅出站身份使用由提供商所有的会话，并与智能体的主会话隔离。
- `--session-key` 用于选择显式键。带智能体前缀的键必须使用 `agent:<agent-id>:<session-key>`；同时提供 `--agent` 时，其值必须与该智能体 ID 匹配。提供 `--agent` 时，不带前缀且不是哨兵值的键会限定到该智能体；例如，`--agent ops --session-key incident-42` 会路由到 `agent:ops:incident-42`。如果没有 `--agent`，不带前缀且不是哨兵值的键会限定到已配置的默认智能体。只有未提供 `--agent` 时，字面值 `global` 和 `unknown` 才保持无作用域；嵌入式回退路径会将这些哨兵会话解析到已配置的默认智能体。
- `--reply-channel` 和 `--reply-account` 仅影响交付。
- 思考和详细级别标志会持久化到会话存储中。
- 输出：默认使用纯文本，也可使用 `--json` 输出结构化载荷和元数据。
- 使用 `--json --deliver` 时，JSON 会包含已发送、已抑制、部分成功和发送失败的交付状态。请参阅
  [JSON 交付状态](/zh-CN/cli/agent#json-delivery-status)。

## 示例

```bash
# 使用 JSON 输出的简单轮次
openclaw agent --to +15555550123 --message "追踪日志" --verbose on --json

# 覆盖模型的轮次
openclaw agent --agent ops --model openai/gpt-5.4 --message "总结日志"

# 指定思考级别的轮次
openclaw agent --session-id 1234 --message "总结收件箱" --thinking medium

# 从文件读取多行提示词
openclaw agent --agent ops --message-file ./task.md

# 确切的会话键
openclaw agent --session-key agent:ops:incident-42 --message "总结状态"

# 限定到智能体的旧版键
openclaw agent --agent ops --session-key incident-42 --message "总结状态"

# 交付到与会话不同的渠道
openclaw agent --agent ops --message "警报" --deliver --reply-channel telegram --reply-to "@admin"
```

## 相关内容

<CardGroup cols={2}>
  <Card title="Agent CLI 参考" href="/zh-CN/cli/agent" icon="terminal">
    完整的 `openclaw agent` 标志和选项参考。
  </Card>
  <Card title="子智能体" href="/zh-CN/tools/subagents" icon="users">
    在后台生成子智能体。
  </Card>
  <Card title="会话" href="/zh-CN/concepts/session" icon="comments">
    会话键的工作方式，以及如何解析 `--to`、`--agent` 和 `--session-id`。
  </Card>
  <Card title="斜杠命令" href="/zh-CN/tools/slash-commands" icon="slash">
    智能体会话中使用的原生命令目录。
  </Card>
</CardGroup>
