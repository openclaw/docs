---
read_when:
    - 你想从 CLI 编辑 Exec 审批
    - 你需要在 Gateway 网关或节点主机上管理允许列表
summary: '`openclaw approvals` 和 `openclaw exec-policy` 的 CLI 参考'
title: 审批
x-i18n:
    generated_at: "2026-07-12T14:20:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f5b045a4dee3726a7df2368b704a00464dc9e575bf77747103e34ebdfe0aa2df
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

管理**本地主机**、**Gateway 网关主机**或**节点主机**的 Exec 审批。如果不指定目标标志，命令会读取或写入磁盘上的本地审批文件。使用 `--gateway` 指定 Gateway 网关，或使用 `--node <id|name|ip>` 指定特定节点。

别名：`openclaw exec-approvals`

相关内容：[Exec 审批](/zh-CN/tools/exec-approvals)、[节点](/zh-CN/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` 是一个**仅限本地**的便捷命令，可通过一个步骤使请求的 `tools.exec.*` 配置与本地主机审批文件保持同步：

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

预设（`yolo`、`cautious`、`deny-all`）会同时应用 `host`、`security`、`ask` 和 `askFallback`。`set` 仅应用你传入的标志；每个接受的值都会经过验证（`--host auto|sandbox|gateway|node`、`--security deny|allowlist|full`、`--ask off|on-miss|always`、`--ask-fallback deny|allowlist|full`）。

作用范围：

- 同时更新本地配置文件和本地审批文件；不会将策略推送到 Gateway 网关或节点主机。
- `--host node` 会被拒绝：节点 Exec 审批在运行时从节点获取，因此本地 `exec-policy` 无法同步这些审批。请改用 `openclaw approvals set --node <id|name|ip>`。
- `exec-policy show` 会将 `host=node` 作用域标记为运行时由节点管理，而不是从本地审批文件推导有效策略。

对于远程主机审批，请直接使用 `openclaw approvals set --gateway` 或 `openclaw approvals set --node <id|name|ip>`。

## 常用命令

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`get` 显示目标的有效 Exec 策略：请求的 `tools.exec` 策略、主机审批文件策略，以及合并后的有效结果。具有主机原生策略的节点（例如 Windows 配套应用）会直接显示该策略，而不会应用 OpenClaw 审批文件的策略计算逻辑。

对于使用文件存储审批的节点，合并视图需要由主机解析的策略快照。较旧的节点会将有效策略显示为不可用，而不会假定 Gateway 网关请求的策略同样适用于该主机。

<Note>
不包含每个会话的 `/exec` 覆盖设置。请在相关会话中运行 `/exec`，以查看其当前默认值。
</Note>

优先级：

- 主机审批文件是可强制执行的事实来源。
- 请求的 `tools.exec` 策略可以收窄或扩大意图，但有效结果由主机规则推导得出。
- `--node` 会将节点主机审批文件与 Gateway 网关的 `tools.exec` 策略相结合（两者都会在运行时应用）。
- 如果 Gateway 网关配置不可用，CLI 会回退到节点审批快照，并注明无法计算最终的运行时策略。

## 从文件替换审批设置

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` 接受 JSON5，而不仅限于严格 JSON。请使用 `--file` 或 `--stdin`，不能同时使用两者。

使用主机原生策略的 Windows 节点采用其自身的策略结构：

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  defaultAction: "deny",
  rules: [{ pattern: "hostname", action: "allow" }]
}
EOF
```

CLI 会先读取节点的当前哈希值，并随更新一起发送，因此并发的本地编辑会被拒绝，而不是被覆盖。由于此操作会替换节点的完整规则列表，因此必须提供 `rules`；`defaultAction` 为可选项。如果节点报告其原生策略已禁用，则无法远程配置该节点；请先在该主机上启用或配置策略。主机原生策略不支持 `allowlist add|remove` 辅助命令。

## “从不提示”/ YOLO 示例

对于不应因 Exec 审批而停止的主机，将其主机审批默认值设置为 `full` + `off`：

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

对于公开 OpenClaw 审批文件的节点，请通过 `openclaw approvals set --node <id|name|ip> --stdin` 使用相同内容。使用主机原生策略的节点需要采用上面所示的所有者特定结构。

这只会更改**主机审批文件**。要使请求的 OpenClaw 策略也保持一致，还需设置：

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

此处明确指定 `tools.exec.host=gateway`，因为 `host=auto` 仍表示“沙箱可用时使用沙箱，否则使用 Gateway 网关”：YOLO 针对的是审批，而不是路由。如果你希望即使配置了沙箱也在主机上执行 Exec，请使用 `gateway`（或 `/exec host=gateway`）。

省略 `askFallback` 时，默认值为 `deny`。升级没有 UI 且应继续保持从不提示行为的主机时，请明确设置 `askFallback: "full"`。

仅在本地计算机上表达相同意图的快捷命令：

```bash
openclaw exec-policy preset yolo
```

## 允许列表辅助命令

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## 常用选项

`get`、`set` 和 `allowlist add|remove` 均支持：

- `--node <id|name|ip>`（可解析 ID、名称、IP 或 ID 前缀；使用与 `openclaw nodes` 相同的解析器）
- `--gateway`
- 共享的节点 RPC 选项：`--url`、`--token`、`--timeout`、`--json`

不指定目标标志时，使用磁盘上的本地审批文件。

`allowlist add|remove` 还支持 `--agent <id>`（默认为 `"*"`，适用于所有智能体）。

## 注意事项

- 节点主机必须公布 `system.execApprovals.get/set`（macOS 应用、无界面节点主机或 Windows 配套应用）。
- 审批文件按主机存储在 OpenClaw 状态目录中：`$OPENCLAW_STATE_DIR/exec-approvals.json`；未设置该变量时，则存储在 `~/.openclaw/exec-approvals.json`。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Exec 审批](/zh-CN/tools/exec-approvals)
