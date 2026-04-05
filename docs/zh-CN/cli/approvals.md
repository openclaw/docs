---
read_when:
    - 你想通过 CLI 编辑 exec 审批
    - 你需要管理 Gateway 网关或节点主机上的允许列表
summary: '`openclaw approvals` 的 CLI 参考（用于 Gateway 网关或节点主机的 exec 审批）'
title: approvals
x-i18n:
    generated_at: "2026-04-05T08:18:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b2532bfd3e6e6ce43c96a2807df2dd00cb7b4320b77a7dfd09bee0531da610e
    source_path: cli/approvals.md
    workflow: 15
---

# `openclaw approvals`

管理 **本地主机**、**Gateway 网关主机** 或 **节点主机** 的 exec 审批。
默认情况下，命令会以磁盘上的本地审批文件为目标。使用 `--gateway` 以 Gateway 网关为目标，或使用 `--node` 以特定节点为目标。

别名：`openclaw exec-approvals`

相关内容：

- Exec 审批：[Exec approvals](/tools/exec-approvals)
- 节点：[Nodes](/nodes)

## 常用命令

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` 现在会显示本地、Gateway 网关和节点目标的生效 exec 策略：

- 请求的 `tools.exec` 策略
- 主机审批文件策略
- 应用优先级规则后的生效结果

这种优先级是有意设计的：

- 主机审批文件是可执行的事实来源
- 请求的 `tools.exec` 策略可以收紧或放宽意图，但生效结果仍然由主机规则推导得出
- `--node` 会将节点主机审批文件与 Gateway 网关 `tools.exec` 策略组合，因为两者在运行时都会生效
- 如果 Gateway 网关配置不可用，CLI 会回退到节点审批快照，并说明无法计算最终的运行时策略

## 从文件替换审批配置

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` 接受 JSON5，而不只是严格的 JSON。使用 `--file` 或 `--stdin` 其中之一，不要同时使用。

## “永不提示” / YOLO 示例

对于一个不应该因 exec 审批而中断的主机，将主机审批默认值设置为 `full` + `off`：

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

这只会更改**主机审批文件**。为了让请求的 OpenClaw 策略保持一致，还要设置：

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

为什么这个示例中使用 `tools.exec.host=gateway`：

- `host=auto` 仍然表示“如果有沙箱就使用沙箱，否则使用 Gateway 网关”。
- YOLO 针对的是审批，而不是路由。
- 如果你希望即使配置了沙箱也使用主机 exec，请通过 `gateway` 或 `/exec host=gateway` 显式指定主机选择。

这与当前默认主机的 YOLO 行为一致。如果你希望保留审批，请收紧它。

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

- 不带目标标志表示磁盘上的本地审批文件
- `--gateway` 以 Gateway 网关主机审批文件为目标
- `--node` 在解析 id、名称、IP 或 id 前缀后，以某个节点主机为目标

`allowlist add|remove` 还支持：

- `--agent <id>`（默认为 `*`）

## 说明

- `--node` 使用与 `openclaw nodes` 相同的解析器（id、名称、ip 或 id 前缀）。
- `--agent` 默认为 `"*"`，适用于所有智能体。
- 节点主机必须声明 `system.execApprovals.get/set`（macOS 应用或无头节点主机）。
- 审批文件按主机存储在 `~/.openclaw/exec-approvals.json`。
