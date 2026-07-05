---
read_when:
    - 选择用于命令权限的 auto、ask、allowlist、full 或 deny
    - 通过 tools.exec.mode 配置 Codex Guardian 已审查的审批
    - OpenClaw Exec 审批与 ACPX harness 权限对比
summary: 主机 Exec、Codex Guardian 审批和 ACPX 运行框架会话的权限模式
title: 权限模式
x-i18n:
    generated_at: "2026-07-05T11:46:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f580e66508c1f69e868ed26a62d88a675f86a4d1ca738650dc5af82e967f3ac3
    source_path: tools/permission-modes.md
    workflow: 16
---

权限模式决定 Agent 在运行宿主命令、写入文件或请求后端 harness 获取额外访问权限之前拥有多少权限。

<Note>
  权限模式不同于 `tools.exec.host=auto`。`tools.exec.host`
  选择命令在哪里运行。`tools.exec.mode` 选择宿主 exec 如何
  审批。
</Note>

## 推荐默认值

对于需要实用宿主访问权限、但不想每次未命中都提示人工的代码 Agent，使用 `auto`：

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

然后验证生效的策略：

```bash
openclaw exec-policy show
```

## OpenClaw 宿主 exec 模式

`tools.exec.mode` 是宿主 `exec` 的规范化策略表面。每种模式都会解析到底层的 `security`（允许列表严格程度）和 `ask`（未命中时提示）组合：

| 模式        | security / ask          | 行为                                                                                      | 使用场景                                              |
| ----------- | ----------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `deny`      | `deny` / `off`          | 完全阻止宿主 exec。                                                                     | 不允许任何宿主命令。                         |
| `allowlist` | `allowlist` / `off`     | 只运行允许列表中的命令；静默拒绝未命中项。                                          | 你有一组已知安全的命令。                    |
| `ask`       | `allowlist` / `on-miss` | 运行允许列表匹配项；未命中时询问人工。                                                 | 每个新命令都应由人工审查。              |
| `auto`      | `allowlist` / `on-miss` | 运行允许列表匹配项；未命中项先经过自动审查，再回退到人工审批。 | 代码会话需要实用且有防护的访问权限。        |
| `full`      | `full` / `off`          | 无需提示即可运行宿主 exec。                                                                | 此受信任的宿主/会话应跳过审批关卡。 |

`ask` 和 `auto` 共享相同的允许列表/询问设置；`auto` 还会启用原生自动审查器，它会自行判定未命中项，并且仅在无法安全批准时才转交给配置的人工审批路径。

如需完整的宿主 exec 策略、本地审批文件、允许列表 schema、安全 bin 和转发行为，请参阅 [Exec 审批](/zh-CN/tools/exec-approvals)。

## Codex Guardian 映射

对于原生 Codex app-server 会话，当本地 Codex 要求允许时，`tools.exec.mode: "auto"` 会驱动 Codex 使用 Guardian 审查的审批。典型生成值：

| Codex 字段         | 典型值     |
| ------------------- | ----------------- |
| `approvalPolicy`    | `on-request`      |
| `approvalsReviewer` | `auto_review`     |
| `sandbox`           | `workspace-write` |

`auto` 模式会强制使用此策略，覆盖任何已配置的 Codex 沙箱/审批替代项，因此不会保留旧版不安全组合，例如 `approvalPolicy: "never"` 与 `sandbox: "danger-full-access"`。`tools.exec.mode: "deny"` 和 `"allowlist"` 会完全阻止 Codex app-server 本地执行。仅当你有意采用无审批姿态时，才使用 `tools.exec.mode: "full"`。

有关 app-server 设置、认证顺序和原生 Codex 运行时详情，请参阅 [Codex harness](/zh-CN/plugins/codex-harness)。

## ACPX harness 权限

ACPX 会话是非交互式的，因此无法点击 TTY 权限提示。ACPX 使用 `plugins.entries.acpx.config` 下独立的 harness 级设置：

| 设置                     | 值          | 含义                                     |
| --------------------------- | --------------- | ------------------------------------------- |
| `permissionMode`            | `approve-reads` | 仅自动批准读取。                    |
| `permissionMode`            | `approve-all`   | 自动批准写入和 shell 命令。     |
| `permissionMode`            | `deny-all`      | 拒绝所有权限提示。                |
| `nonInteractivePermissions` | `fail`          | 当需要提示时中止。      |
| `nonInteractivePermissions` | `deny`          | 拒绝提示，并在可能时继续。 |

将 ACPX 权限与 OpenClaw exec 审批分开设置：

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

将 `approve-all` 用作 ACPX 的 break-glass 等价模式，表示无需提示的 harness 会话。有关设置详情和失败模式，请参阅 [ACP Agents 设置](/zh-CN/tools/acp-agents-setup#permission-configuration)。

## 选择模式

| 目标                                          | 配置                                                   |
| --------------------------------------------- | ----------------------------------------------------------- |
| 完全阻止宿主命令                | `tools.exec.mode: "deny"`                                   |
| 只允许运行已知安全的命令              | `tools.exec.mode: "allowlist"`                              |
| 对每种新命令形态询问人工       | `tools.exec.mode: "ask"`                                    |
| 在人工之前使用 Codex/OpenClaw 自动审查  | `tools.exec.mode: "auto"`                                   |
| 完全跳过宿主 exec 审批             | `tools.exec.mode: "full"` 加上匹配的宿主审批文件 |
| 允许非交互式 ACPX 会话写入/执行 | `plugins.entries.acpx.config.permissionMode: "approve-all"` |

如果更改模式后命令仍然提示或失败，请检查两层：

```bash
openclaw approvals get
openclaw exec-policy show
```

宿主 exec 使用 OpenClaw 配置和宿主本地审批文件中更严格的结果。ACPX harness 权限不会放宽宿主 exec 审批，宿主 exec 审批也不会放宽 ACPX harness 提示。

## 相关

- [Exec 审批](/zh-CN/tools/exec-approvals)
- [Exec 审批 - 高级](/zh-CN/tools/exec-approvals-advanced)
- [Codex harness](/zh-CN/plugins/codex-harness)
- [ACP Agents 设置](/zh-CN/tools/acp-agents-setup#permission-configuration)
