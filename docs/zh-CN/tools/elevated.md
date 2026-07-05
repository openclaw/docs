---
read_when:
    - 调整提升权限模式默认值、允许列表或斜杠命令行为
    - 了解沙箱隔离的智能体如何访问主机
summary: 提升权限的 Exec 模式：从沙箱隔离的智能体在沙箱外运行命令
title: 提升权限模式
x-i18n:
    generated_at: "2026-07-05T11:46:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab035f2f0d0074da4e7661d9d690d89aa5eea25b7920ce48a2a03dffccded85b
    source_path: tools/elevated.md
    workflow: 16
---

当智能体在沙箱中运行时，它的 `exec` 命令会被限制在沙箱环境内。**提升权限模式**让智能体可以改为跳出沙箱，在沙箱外运行命令，并带有可配置的审批门禁。

<Info>
  提升权限模式只会在智能体处于**沙箱隔离**状态时改变行为。对于未沙箱隔离的智能体，exec 已经在主机上运行。
</Info>

## 指令

使用斜杠命令按会话控制提升权限模式：

| 指令             | 作用                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `/elevated on`   | 在配置的主机路径上于沙箱外运行，保留审批                                                                                       |
| `/elevated ask`  | 与 `on` 相同（别名）                                                                                                            |
| `/elevated full` | 在配置的主机路径上于沙箱外运行，并在模式/主机审批策略已经足够宽松时跳过审批                                                    |
| `/elevated off`  | 返回受沙箱限制的执行                                                                                                            |

也可以使用 `/elev on|off|ask|full`。

发送不带参数的 `/elevated` 可查看当前级别。

## 工作原理

<Steps>
  <Step title="检查可用性">
    必须在配置中启用提升权限，并且发送者必须在 allowlist 中：

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

    或者内联使用（仅应用于该消息）：

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="命令在沙箱外运行">
    启用提升权限后，`exec` 调用会离开沙箱。有效主机默认是
    `gateway`，当配置的/会话的 exec 目标为
    `node` 时则为 `node`。在 `full` 模式下，如果解析后的 exec
    模式/主机审批策略已经完全宽松（security `full`、
    ask `off`），则会跳过 exec 审批；否则仍会应用正常审批策略。在
    `on`/`ask` 模式下，始终应用已配置的审批规则。
  </Step>
</Steps>

## 解析顺序

1. 消息中的**内联指令**（仅应用于该消息）
2. **会话覆盖**（通过发送仅包含指令的消息设置）
3. **全局默认值**（配置中的 `agents.defaults.elevatedDefault`）

## 可用性和 allowlist

- **全局门禁**：`tools.elevated.enabled`（必须为 `true`）
- **发送者 allowlist**：`tools.elevated.allowFrom`，包含按渠道划分的列表
- **按智能体门禁**：`agents.list[].tools.elevated.enabled`（只能进一步限制；全局门禁和按智能体门禁都必须为 `true`）
- **按智能体 allowlist**：`agents.list[].tools.elevated.allowFrom`（发送者必须同时匹配全局 + 按智能体）
- **渠道提供的回退 allowlist**：渠道插件可以选择通过 SDK 适配器钩子提供回退 allowlist，在未配置 `tools.elevated.allowFrom.<provider>` 时使用。目前没有内置渠道实现此钩子，因此实际使用中，每个提供商现在都需要显式的 `tools.elevated.allowFrom.<provider>` 条目。
- **所有门禁都必须通过**；否则提升权限会被视为不可用

Allowlist 条目格式：

| 前缀                    | 匹配内容                        |
| ----------------------- | ------------------------------- |
| （无）                  | 发送者 ID、E.164 或 From 字段   |
| `name:`                 | 发送者显示名称                  |
| `username:`             | 发送者用户名                    |
| `tag:`                  | 发送者标签                      |
| `id:`, `from:`, `e164:` | 显式身份目标                    |

## 提升权限不控制什么

- **工具策略**：如果 `exec` 被工具策略拒绝，提升权限无法覆盖它。
- **主机选择策略**：提升权限不会把 `auto` 变成任意跨主机覆盖。它使用配置的/会话的 exec 目标规则，仅在目标已经是 `node` 时选择 `node`。
- **与 `/exec` 分离**：`/exec` 指令会为已授权发送者调整按会话的 exec 默认值（host、security、ask、node），并且不需要提升权限模式。

<Note>
  bash 聊天命令（`!` 前缀；`/bash` 别名）是一个独立门禁，除了自己的 `tools.bash.enabled` 标志外，还要求启用 `tools.elevated`。禁用提升权限也会锁定 `!` shell 命令。
</Note>

## 相关

<CardGroup cols={2}>
  <Card title="Exec tool" href="/zh-CN/tools/exec" icon="terminal">
    从智能体执行 Shell 命令。
  </Card>
  <Card title="Exec approvals" href="/zh-CN/tools/exec-approvals" icon="shield">
    `exec` 的审批和 allowlist 系统。
  </Card>
  <Card title="Sandboxing" href="/zh-CN/gateway/sandboxing" icon="box">
    Gateway 网关级沙箱配置。
  </Card>
  <Card title="Sandbox vs Tool Policy vs Elevated" href="/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated" icon="scale-balanced">
    三个门禁在工具调用期间如何组合。
  </Card>
</CardGroup>
