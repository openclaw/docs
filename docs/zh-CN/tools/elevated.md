---
read_when:
    - 调整 elevated 模式默认值、允许列表或斜杠命令行为
    - 了解沙箱隔离智能体如何访问主机
summary: Elevated exec 模式：让沙箱隔离智能体在沙箱外运行命令
title: Elevated 模式
x-i18n:
    generated_at: "2026-04-05T10:11:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: f6f0ca0a7c03c94554a70fee775aa92085f15015850c3abaa2c1c46ced9d3c2e
    source_path: tools/elevated.md
    workflow: 15
---

# Elevated 模式

当智能体在沙箱中运行时，它的 `exec` 命令会被限制在沙箱环境内。**Elevated 模式** 允许智能体突破限制，改为在沙箱之外运行命令，并可配置审批门槛。

<Info>
  Elevated 模式仅在智能体处于**沙箱隔离**状态时改变行为。对于
  非沙箱隔离智能体，exec 本来就会在主机上运行。
</Info>

## 指令

使用斜杠命令按会话控制 elevated 模式：

| 指令             | 作用                                                             |
| ---------------- | ---------------------------------------------------------------- |
| `/elevated on`   | 在已配置的主机路径上于沙箱外运行，并保留审批                     |
| `/elevated ask`  | 与 `on` 相同（别名）                                             |
| `/elevated full` | 在已配置的主机路径上于沙箱外运行，并跳过审批                     |
| `/elevated off`  | 返回到受限于沙箱的执行                                           |

也可使用 `/elev on|off|ask|full`。

发送不带参数的 `/elevated` 可查看当前级别。

## 工作原理

<Steps>
  <Step title="检查可用性">
    必须在配置中启用 elevated，并且发送者必须位于允许列表中：

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

    也可以内联使用（仅对该条消息生效）：

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="命令在沙箱之外运行">
    启用 elevated 后，`exec` 调用会离开沙箱。默认的实际主机是
    `gateway`，当已配置/会话中的 exec 目标为 `node` 时则为 `node`。在 `full`
    模式下，会跳过 exec 审批。在 `on`/`ask` 模式下，已配置的审批规则仍然适用。
  </Step>
</Steps>

## 解析顺序

1. 消息中的**内联指令**（仅对该条消息生效）
2. **会话覆盖**（通过发送仅包含指令的消息设置）
3. **全局默认值**（配置中的 `agents.defaults.elevatedDefault`）

## 可用性和允许列表

- **全局门槛**：`tools.elevated.enabled`（必须为 `true`）
- **发送者允许列表**：使用按渠道划分列表的 `tools.elevated.allowFrom`
- **每智能体门槛**：`agents.list[].tools.elevated.enabled`（只能进一步收紧）
- **每智能体允许列表**：`agents.list[].tools.elevated.allowFrom`（发送者必须同时匹配全局 + 每智能体）
- **Discord 回退**：如果省略 `tools.elevated.allowFrom.discord`，则会回退使用 `channels.discord.allowFrom`
- **所有门槛都必须通过**；否则 elevated 会被视为不可用

允许列表条目格式：

| 前缀                    | 匹配内容                         |
| ----------------------- | -------------------------------- |
| （无）                  | 发送者 ID、E.164 或 From 字段    |
| `name:`                 | 发送者显示名称                   |
| `username:`             | 发送者用户名                     |
| `tag:`                  | 发送者标签                       |
| `id:`, `from:`, `e164:` | 显式身份定位                     |

## elevated 不控制的内容

- **工具策略**：如果工具策略拒绝了 `exec`，elevated 也无法覆盖它
- **主机选择策略**：elevated 不会把 `auto` 变成可自由跨主机覆盖的选项。它会使用已配置/会话中的 exec 目标规则，仅当目标本来就是 `node` 时才选择 `node`。
- **与 `/exec` 分离**：`/exec` 指令会为已获授权的发送者调整按会话生效的 exec 默认值，并且不需要 elevated 模式

## 相关内容

- [Exec 工具](/zh-CN/tools/exec) —— shell 命令执行
- [Exec 审批](/zh-CN/tools/exec-approvals) —— 审批和允许列表系统
- [沙箱隔离](/zh-CN/gateway/sandboxing) —— 沙箱配置
- [沙箱与工具策略与 Elevated](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)
