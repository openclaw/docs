---
read_when:
    - 调整提权模式默认值、允许名单或斜杠命令行为
    - 了解沙箱隔离的智能体如何访问主机
summary: 提权执行模式：从沙箱隔离的智能体在沙箱外运行命令
title: 提升权限模式
x-i18n:
    generated_at: "2026-05-05T23:54:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91aab7c105643d8e5d07d89cd5ab176f0a40cd3d23e2b20b3986cbf76f575d64
    source_path: tools/elevated.md
    workflow: 16
---

当智能体在沙箱内运行时，它的 `exec` 命令会被限制在沙箱环境中。**提升模式**允许智能体改为跳出沙箱，在沙箱外运行命令，并带有可配置的审批门禁。

<Info>
  提升模式只有在智能体**沙箱隔离**时才会改变行为。对于未沙箱隔离的智能体，exec 已经在主机上运行。
</Info>

## 指令

使用斜杠命令按会话控制提升模式：

| 指令             | 作用                                                                   |
| ---------------- | ---------------------------------------------------------------------- |
| `/elevated on`   | 在配置的主机路径上于沙箱外运行，保留审批                               |
| `/elevated ask`  | 与 `on` 相同（别名）                                                   |
| `/elevated full` | 在配置的主机路径上于沙箱外运行，并跳过审批                             |
| `/elevated off`  | 返回到受沙箱限制的执行                                                 |

也可以使用 `/elev on|off|ask|full`。

发送不带参数的 `/elevated` 可查看当前级别。

## 工作原理

<Steps>
  <Step title="检查可用性">
    必须在配置中启用提升模式，并且发送者必须在允许列表中：

    ```json5
    {
      tools: {
        elevated: {
          enabled: true,
          allowFrom: {
            discord: ["user-id-123"],
            whatsapp: ["+15555550123"],
          },
        },
      },
    }
    ```

  </Step>

  <Step title="设置级别">
    发送仅包含指令的消息来设置会话默认值：

    ```
    /elevated full
    ```

    或者内联使用它（仅应用于该消息）：

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="命令在沙箱外运行">
    启用提升模式后，`exec` 调用会离开沙箱。有效主机默认为 `gateway`，或者当配置的/会话的 exec 目标为 `node` 时为 `node`。在 `full` 模式下，会跳过 exec 审批。在 `on`/`ask` 模式下，配置的审批规则仍然适用。
  </Step>
</Steps>

## 解析顺序

1. 消息上的**内联指令**（仅应用于该消息）
2. **会话覆盖**（通过发送仅包含指令的消息设置）
3. **全局默认值**（配置中的 `agents.defaults.elevatedDefault`）

## 可用性和允许列表

- **全局门禁**：`tools.elevated.enabled`（必须为 `true`）
- **发送者允许列表**：`tools.elevated.allowFrom`，按渠道列出
- **每智能体门禁**：`agents.list[].tools.elevated.enabled`（只能进一步限制）
- **每智能体允许列表**：`agents.list[].tools.elevated.allowFrom`（发送者必须同时匹配全局 + 每智能体）
- **Discord 回退**：如果省略 `tools.elevated.allowFrom.discord`，则使用 `channels.discord.allowFrom` 作为回退
- **所有门禁都必须通过**；否则提升模式会被视为不可用

允许列表条目格式：

| 前缀                    | 匹配项                          |
| ----------------------- | ------------------------------- |
| （无）                  | 发送者 ID、E.164 或 From 字段   |
| `name:`                 | 发送者显示名称                  |
| `username:`             | 发送者用户名                    |
| `tag:`                  | 发送者标签                      |
| `id:`, `from:`, `e164:` | 显式身份定位                    |

## 提升模式不控制什么

- **工具策略**：如果工具策略拒绝 `exec`，提升模式无法覆盖它。
- **主机选择策略**：提升模式不会把 `auto` 变成不受限制的跨主机覆盖。它使用配置的/会话的 exec 目标规则，只有当目标已经是 `node` 时才选择 `node`。
- **独立于 `/exec`**：`/exec` 指令会为授权发送者调整每会话 exec 默认值，并且不需要提升模式。

<Note>
  bash 聊天命令（`!` 前缀；`/bash` 别名）是一个单独门禁，除了它自己的 `tools.bash.enabled` 标志外，还要求启用 `tools.elevated`。禁用提升模式也会锁定 `!` shell 命令。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="Exec 工具" href="/zh-CN/tools/exec" icon="terminal">
    来自智能体的 Shell 命令执行。
  </Card>
  <Card title="Exec 审批" href="/zh-CN/tools/exec-approvals" icon="shield">
    `exec` 的审批和允许列表系统。
  </Card>
  <Card title="沙箱隔离" href="/zh-CN/gateway/sandboxing" icon="box">
    Gateway 网关级沙箱配置。
  </Card>
  <Card title="沙箱、工具策略与提升模式" href="/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated" icon="scale-balanced">
    三个门禁在工具调用期间如何组合。
  </Card>
</CardGroup>
