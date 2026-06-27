---
read_when:
    - 你想从 CLI 编辑 Exec 审批
    - 你需要在 Gateway 网关或节点主机上管理允许列表
summary: CLI 参考：`openclaw approvals` 和 `openclaw exec-policy`
title: 审批
x-i18n:
    generated_at: "2026-06-27T01:35:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e5521622ee48237d3cc9feaa54906d026dfb15da4c9b9b17655cd59b35cae19d
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

管理 **本地主机**、**Gateway 网关主机** 或 **节点主机** 的 Exec 审批。
默认情况下，命令会针对磁盘上的本地审批文件。使用 `--gateway` 针对 Gateway 网关，或使用 `--node` 针对特定节点。

别名：`openclaw exec-approvals`

相关：

- Exec 审批：[Exec 审批](/zh-CN/tools/exec-approvals)
- 节点：[节点](/zh-CN/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` 是一个本地便捷命令，用于一步保持请求的
`tools.exec.*` 配置和本地主机审批文件一致。

当你想要执行以下操作时使用它：

- 检查本地请求的策略、主机审批文件和有效合并结果
- 应用本地预设，例如 YOLO 或全部拒绝
- 同步本地 `tools.exec.*` 和本地主机审批文件

示例：

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

输出模式：

- 无 `--json`：打印人类可读的表格视图
- `--json`：打印机器可读的结构化输出

当前范围：

- `exec-policy` **仅限本地**
- 它会同时更新本地配置文件和本地审批文件
- 它**不会**将策略推送到 Gateway 网关主机或节点主机
- 此命令会拒绝 `--host node`，因为节点 Exec 审批是在运行时从节点获取的，必须改用针对节点的审批命令进行管理
- `openclaw exec-policy show` 会将 `host=node` 范围标记为运行时由节点管理，而不是从本地审批文件派生有效策略

如果你需要直接编辑远程主机审批，请继续使用 `openclaw approvals set --gateway`
或 `openclaw approvals set --node <id|name|ip>`。

## 常用命令

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` 现在会显示本地、Gateway 网关和节点目标的有效 Exec 策略：

- 请求的 `tools.exec` 策略
- 主机审批文件策略
- 应用优先级规则后的有效结果

优先级是有意设计的：

- 主机审批文件是可执行的事实来源
- 请求的 `tools.exec` 策略可以收窄或放宽意图，但有效结果仍然从主机规则派生
- `--node` 会将节点主机审批文件与 Gateway 网关 `tools.exec` 策略组合起来，因为两者在运行时仍然适用
- 如果 Gateway 网关配置不可用，CLI 会回退到节点审批快照，并注明无法计算最终运行时策略

## 从文件替换审批

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` 接受 JSON5，不只接受严格 JSON。使用 `--file` 或 `--stdin` 其中之一，不要同时使用。

## “永不提示”/ YOLO 示例

对于不应因 Exec 审批而停止的主机，将主机审批默认值设为 `full` + `off`：

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

节点变体：

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
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

这只会更改**主机审批文件**。若要同时保持请求的 OpenClaw 策略一致，还要设置：

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

此示例中为什么使用 `tools.exec.host=gateway`：

- `host=auto` 仍表示“可用时使用沙箱，否则使用 Gateway 网关”。
- YOLO 关注的是审批，不是路由。
- 如果你希望即使配置了沙箱也使用主机 Exec，请用 `gateway` 或 `/exec host=gateway` 显式指定主机选择。

省略的 `askFallback` 默认值为 `deny`。升级应保持永不提示行为的无 UI 主机时，请显式设置 `askFallback: "full"`。

本地快捷方式：

```bash
openclaw exec-policy preset yolo
```

该本地快捷方式会同时更新请求的本地 `tools.exec.*` 配置和本地审批默认值。它在意图上等同于上面的手动两步设置，但仅适用于本地机器。

## 允许列表辅助命令

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## 常用选项

`get`、`set` 和 `allowlist add|remove` 都支持：

- `--node <id|name|ip>`
- `--gateway`
- 共享的节点 RPC 选项：`--url`、`--token`、`--timeout`、`--json`

目标选择说明：

- 没有目标标志表示磁盘上的本地审批文件
- `--gateway` 针对 Gateway 网关主机审批文件
- `--node` 会在解析 ID、名称、IP 或 ID 前缀后针对一个节点主机

`allowlist add|remove` 还支持：

- `--agent <id>`（默认值为 `*`）

## 说明

- `--node` 使用与 `openclaw nodes` 相同的解析器（ID、名称、IP 或 ID 前缀）。
- `--agent` 默认值为 `"*"`，适用于所有智能体。
- 节点主机必须声明 `system.execApprovals.get/set`（macOS 应用或无头节点主机）。
- 审批文件按主机存储在 OpenClaw 状态目录中
  （`$OPENCLAW_STATE_DIR/exec-approvals.json`，或
  未设置该变量时的 `~/.openclaw/exec-approvals.json`）。

## 相关

- [CLI 参考](/zh-CN/cli)
- [Exec 审批](/zh-CN/tools/exec-approvals)
