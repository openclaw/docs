---
read_when:
- 调整提升权限模式的默认值、允许列表或 slash 命令行为
- 了解沙箱隔离智能体如何访问宿主机
summary: 提升权限的 exec 模式：从沙箱隔离智能体运行沙箱外命令
title: 提升权限模式
x-i18n:
  generated_at: '2026-04-23T21:07:35Z'
  model: gpt-5.4
  provider: openai
  source_hash: 5b91b4af36f9485695f2afebe9bf8d7274d7aad6d0d88e762e581b0d091e04f7
  source_path: tools/elevated.md
  workflow: 15
---
当智能体在沙箱中运行时，它的 `exec` 命令会被限制在
沙箱环境内。**提升权限模式**允许智能体突破限制，在沙箱外运行命令，
并通过可配置的审批门控进行控制。

<Info>
  提升权限模式只有在智能体**处于沙箱隔离**时才会改变行为。对于
  非沙箱智能体，exec 本来就在宿主机上运行。
</Info>

## 指令

使用 slash 命令按会话控制提升权限模式：

| 指令 | 作用 |
| ---------------- | ---------------------------------------------------------------------- |
| `/elevated on` | 在已配置的宿主路径上于沙箱外运行，并保留审批 |
| `/elevated ask` | 与 `on` 相同（别名） |
| `/elevated full` | 在已配置的宿主路径上于沙箱外运行，并跳过审批 |
| `/elevated off` | 返回到仅限沙箱内执行 |

也可用作 `/elev on|off|ask|full`。

发送不带参数的 `/elevated` 可查看当前级别。

## 工作原理

<Steps>
  <Step title="检查可用性">
    提升权限必须在配置中启用，并且发送者必须在允许列表中：

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

    或将其内联使用（仅对该条消息生效）：

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="命令在沙箱外运行">
    启用提升权限后，`exec` 调用会离开沙箱。默认的有效宿主是
    `gateway`，或者当已配置 / 会话中的 exec 目标为
    `node` 时使用 `node`。在 `full` 模式下，会跳过 exec 审批。在 `on` / `ask` 模式下，
    已配置的审批规则仍然适用。
  </Step>
</Steps>

## 解析顺序

1. 消息上的**内联指令**（仅适用于该条消息）
2. **会话覆盖**（通过发送仅包含指令的消息设置）
3. **全局默认值**（配置中的 `agents.defaults.elevatedDefault`）

## 可用性与允许列表

- **全局门控**：`tools.elevated.enabled`（必须为 `true`）
- **发送者允许列表**：`tools.elevated.allowFrom`，按渠道分别设置列表
- **按智能体门控**：`agents.list[].tools.elevated.enabled`（只能进一步收紧）
- **按智能体允许列表**：`agents.list[].tools.elevated.allowFrom`（发送者必须同时匹配全局 + 智能体级规则）
- **Discord 回退**：如果省略 `tools.elevated.allowFrom.discord`，则回退使用 `channels.discord.allowFrom`
- **所有门控都必须通过**；否则会将提升权限视为不可用

允许列表条目格式：

| 前缀 | 匹配对象 |
| ----------------------- | ------------------------------- |
| （无） | 发送者 ID、E.164 或 From 字段 |
| `name:` | 发送者显示名称 |
| `username:` | 发送者用户名 |
| `tag:` | 发送者标签 |
| `id:`、`from:`、`e164:` | 显式身份定位 |

## 提升权限不控制什么

- **工具策略**：如果 `exec` 被工具策略拒绝，提升权限无法覆盖它
- **宿主选择策略**：提升权限不会把 `auto` 变成可自由跨宿主覆盖的模式。它会使用已配置 / 会话中的 exec 目标规则，仅当目标本来就是 `node` 时才会选择 `node`。
- **与 `/exec` 分离**：`/exec` 指令会为已授权发送者调整按会话生效的 exec 默认值，并且不要求启用提升权限模式

## 相关内容

- [Exec 工具](/zh-CN/tools/exec) —— Shell 命令执行
- [Exec approvals](/zh-CN/tools/exec-approvals) —— 审批与允许列表系统
- [沙箱隔离](/zh-CN/gateway/sandboxing) —— 沙箱配置
- [Sandbox vs Tool Policy vs Elevated](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)
