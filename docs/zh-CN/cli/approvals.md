---
read_when:
    - 你想要从 CLI 编辑执行批准权限
    - 你需要在 Gateway 网关或节点主机上管理允许列表
summary: '`openclaw approvals` 和 `openclaw exec-policy` 的 CLI 参考'
title: 批准
x-i18n:
    generated_at: "2026-04-23T06:17:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e4e031df737e3bdde97ece81fe50eafbb4384557b40c6d52cf2395cf30721a3
    source_path: cli/approvals.md
    workflow: 15
---

# `openclaw approvals`

管理 **本地主机**、**Gateway 网关主机** 或 **节点主机** 的执行批准权限。
默认情况下，命令会针对磁盘上的本地批准文件。使用 `--gateway` 可将目标设为 Gateway 网关，或使用 `--node` 将目标设为特定节点。

别名：`openclaw exec-approvals`

相关内容：

- 执行批准权限：[Exec approvals](/zh-CN/tools/exec-approvals)
- 节点：[Nodes](/zh-CN/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` 是一个本地方便命令，用于一步完成请求的
`tools.exec.*` 配置与本地主机批准文件的对齐。

在以下情况下使用它：

- 检查本地请求的策略、主机批准文件以及最终生效的合并结果
- 应用本地预设，例如 YOLO 或 deny-all
- 同步本地 `tools.exec.*` 和本地 `~/.openclaw/exec-approvals.json`

示例：

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

输出模式：

- 不带 `--json`：打印便于阅读的表格视图
- `--json`：打印机器可读的结构化输出

当前范围：

- `exec-policy` **仅限本地**
- 它会同时更新本地配置文件和本地批准文件
- 它**不会**将策略推送到 Gateway 网关主机或节点主机
- 在此命令中，`--host node` 会被拒绝，因为节点执行批准权限是在运行时从节点获取的，必须改用面向节点的批准命令来管理
- `openclaw exec-policy show` 会将 `host=node` 范围标记为运行时由节点管理，而不是从本地批准文件推导生效策略

如果你需要直接编辑远程主机的批准权限，请继续使用 `openclaw approvals set --gateway`
或 `openclaw approvals set --node <id|name|ip>`。

## 常用命令

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` 现在会显示本地、Gateway 网关和节点目标的生效执行策略：

- 请求的 `tools.exec` 策略
- 主机批准文件策略
- 按优先级规则应用后的生效结果

优先级是有意这样设计的：

- 主机批准文件是可执行的事实来源
- 请求的 `tools.exec` 策略可以收紧或放宽意图，但最终生效结果仍然由主机规则推导得出
- `--node` 会将节点主机批准文件与 Gateway 网关 `tools.exec` 策略组合，因为这两者在运行时仍然都会生效
- 如果 Gateway 网关配置不可用，CLI 会回退到节点批准快照，并注明无法计算最终运行时策略

## 从文件替换批准配置

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` 接受 JSON5，而不只是严格 JSON。使用 `--file` 或 `--stdin` 其中之一，不要同时使用两者。

## “永不提示” / YOLO 示例

对于一个不应因执行批准而中断的主机，将主机批准默认值设为 `full` + `off`：

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

节点版本：

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

这只会更改**主机批准文件**。为了让请求的 OpenClaw 策略也保持一致，还需设置：

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

本示例中为何使用 `tools.exec.host=gateway`：

- `host=auto` 仍表示“如果可用则使用沙箱，否则使用 Gateway 网关”。
- YOLO 针对的是批准权限，而不是路由。
- 如果你希望即使已配置沙箱也使用主机执行，请通过 `gateway` 或 `/exec host=gateway` 显式指定主机选择。

这与当前基于主机默认值的 YOLO 行为一致。如果你希望启用批准控制，请收紧此设置。

本地快捷方式：

```bash
openclaw exec-policy preset yolo
```

这个本地快捷方式会同时更新请求的本地 `tools.exec.*` 配置和
本地批准默认值。它在意图上等同于上面的手动两步设置，
但仅适用于本机。

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

目标说明：

- 不带目标标志表示磁盘上的本地批准文件
- `--gateway` 以 Gateway 网关主机批准文件为目标
- `--node` 会在解析 id、名称、IP 或 id 前缀后，以对应节点主机为目标

`allowlist add|remove` 还支持：

- `--agent <id>`（默认值为 `*`）

## 注意事项

- `--node` 使用与 `openclaw nodes` 相同的解析器（id、名称、ip 或 id 前缀）。
- `--agent` 默认值为 `"*"`，适用于所有智能体。
- 节点主机必须声明 `system.execApprovals.get/set`（macOS 应用或无头节点主机）。
- 批准文件按主机存储在 `~/.openclaw/exec-approvals.json`。
