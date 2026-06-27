---
read_when:
    - 为命令权限选择 auto、ask、allowlist、full 或 deny
    - 通过 tools.exec.mode 配置 Codex Guardian 审核的审批
    - 比较 OpenClaw Exec 审批与 ACPX harness 权限
summary: 主机 exec、Codex Guardian 审批和 ACPX harness 会话的权限模式
title: 权限模式
x-i18n:
    generated_at: "2026-06-27T03:30:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ce89cadb45b3b96ce9ab62b35c06610d02f0ff02f15ef7d2128c59fbebb325a
    source_path: tools/permission-modes.md
    workflow: 16
---

权限模式决定了智能体在运行主机命令、写入文件，或向后端 harness 请求额外访问权限之前拥有多少权限。当你希望 OpenClaw 先使用允许列表，然后对未命中的请求使用 Codex 原生自动审核或人工审批路径时，请从 `tools.exec.mode: "auto"` 开始。

<Note>
  权限模式不同于 `tools.exec.host=auto`。`tools.exec.host`
  选择命令在哪里运行。`tools.exec.mode` 选择主机 exec 如何
  获得审批。
</Note>

## 推荐默认值

对于需要有用主机访问权限、但不希望每次未命中都触发人工提示的代码智能体，请使用 `auto`：

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

然后验证生效策略：

```bash
openclaw exec-policy show
```

在 `auto` 模式下，OpenClaw 会直接运行确定性允许列表匹配项。审批未命中的请求会先经过 OpenClaw 的原生自动审核器，然后在需要时回退到已配置的人工审批路径。

## OpenClaw 主机 exec 模式

`tools.exec.mode` 是主机 `exec` 的规范化策略表面。

| 模式        | 行为                                         | 使用场景                                              |
| ----------- | -------------------------------------------- | ----------------------------------------------------- |
| `deny`      | 阻止主机 exec。                             | 不允许任何主机命令。                                  |
| `allowlist` | 仅运行允许列表中的命令。                    | 你有一组已知安全的命令。                              |
| `ask`       | 运行允许列表匹配项，并对未命中项发起询问。 | 应由人工审核新命令。                                  |
| `auto`      | 运行允许列表匹配项，然后使用自动审核。      | 代码会话需要实用且受保护的访问权限。                  |
| `full`      | 无提示运行主机 exec。                       | 此受信任主机/会话应跳过审批门禁。                     |

有关完整的主机 exec 策略、本地审批文件、允许列表 schema、安全 bin 和转发行为，请参阅 [Exec 审批](/zh-CN/tools/exec-approvals)。

## Codex Guardian 映射

对于原生 Codex app-server 会话，当本地 Codex 要求允许时，`tools.exec.mode: "auto"` 会映射到由 Codex Guardian 审核的审批。OpenClaw 通常发送：

| Codex 字段         | 典型值            |
| ------------------- | ----------------- |
| `approvalPolicy`    | `on-request`      |
| `approvalsReviewer` | `auto_review`     |
| `sandbox`           | `workspace-write` |

在 `auto` 模式下，OpenClaw 不会保留旧版不安全的 Codex 覆盖项，例如 `approvalPolicy: "never"` 或 `sandbox: "danger-full-access"`。仅当你有意采用无审批姿态时，才使用 `tools.exec.mode: "full"`。

有关 app-server 设置、认证顺序和原生 Codex 运行时详情，请参阅 [Codex harness](/zh-CN/plugins/codex-harness)。

## ACPX harness 权限

ACPX 会话是非交互式的，因此无法点击 TTY 权限提示。ACPX 使用 `plugins.entries.acpx.config` 下的独立 harness 级设置：

| 设置                        | 常用值          | 含义                                      |
| --------------------------- | --------------- | ----------------------------------------- |
| `permissionMode`            | `approve-reads` | 仅自动批准读取。                          |
| `permissionMode`            | `approve-all`   | 自动批准写入和 shell 命令。               |
| `permissionMode`            | `deny-all`      | 拒绝所有权限提示。                        |
| `nonInteractivePermissions` | `fail`          | 当需要提示时中止。                        |
| `nonInteractivePermissions` | `deny`          | 拒绝提示，并在可能时继续。                |

请将 ACPX 权限与 OpenClaw exec 审批分开设置：

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

将 `approve-all` 用作 ACPX 无提示 harness 会话的破窗等效设置。有关设置详情和失败模式，请参阅 [ACP Agents 设置](/zh-CN/tools/acp-agents-setup#permission-configuration)。

## 选择模式

| 目标                                          | 配置                                                        |
| --------------------------------------------- | ----------------------------------------------------------- |
| 完全阻止主机命令                              | `tools.exec.mode: "deny"`                                   |
| 仅允许运行已知安全的命令                      | `tools.exec.mode: "allowlist"`                              |
| 对每种新命令形态都询问人工                    | `tools.exec.mode: "ask"`                                    |
| 在人工之前使用 Codex/OpenClaw 自动审核        | `tools.exec.mode: "auto"`                                   |
| 完全跳过主机 exec 审批                        | `tools.exec.mode: "full"` 加匹配的主机审批文件              |
| 让非交互式 ACPX 会话能够写入/exec             | `plugins.entries.acpx.config.permissionMode: "approve-all"` |

如果更改模式后命令仍然提示或失败，请检查两个层级：

```bash
openclaw approvals get
openclaw exec-policy show
```

主机 exec 使用 OpenClaw 配置和主机本地审批文件中更严格的结果。ACPX harness 权限不会放宽主机 exec 审批，主机 exec 审批也不会放宽 ACPX harness 提示。

## 相关

- [Exec 审批](/zh-CN/tools/exec-approvals)
- [Exec 审批 - 高级](/zh-CN/tools/exec-approvals-advanced)
- [Codex harness](/zh-CN/plugins/codex-harness)
- [ACP Agents 设置](/zh-CN/tools/acp-agents-setup#permission-configuration)
