---
read_when:
    - 你想从 CLI 编辑 Exec 审批
    - 你需要管理 Gateway 网关或节点主机上的允许列表
summary: '`openclaw approvals` 和 `openclaw exec-policy` 的 CLI 参考'
title: 审批
x-i18n:
    generated_at: "2026-07-05T11:08:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 30e1f55104d5f762d7eec95f2bba5e0cc52acb3005255aa9fd5c121fb959a0e7
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

管理**本地主机**、**Gateway 网关主机**或**节点主机**的 Exec 审批。没有目标标志时，命令会读取/写入磁盘上的本地审批文件。使用 `--gateway` 以 Gateway 网关为目标，或使用 `--node <id|name|ip>` 以特定节点为目标。

别名：`openclaw exec-approvals`

相关：[Exec 审批](/zh-CN/tools/exec-approvals)、[节点](/zh-CN/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` 是一个**仅限本地**的便捷命令，可一步同步请求的 `tools.exec.*` 配置和本地主机审批文件：

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

预设（`yolo`、`cautious`、`deny-all`）会同时应用 `host`、`security`、`ask` 和 `askFallback`。`set` 只应用你传入的标志；每个接受的值都会被验证（`--host auto|sandbox|gateway|node`、`--security deny|allowlist|full`、`--ask off|on-miss|always`、`--ask-fallback deny|allowlist|full`）。

作用范围：

- 同时更新本地配置文件和本地审批文件；不会将策略推送到 Gateway 网关或节点主机。
- `--host node` 会被拒绝：节点 Exec 审批会在运行时从节点获取，因此本地 `exec-policy` 无法同步它们。请改用 `openclaw approvals set --node <id|name|ip>`。
- `exec-policy show` 会将 `host=node` 作用域标记为运行时由节点管理，而不是从本地审批文件推导有效策略。

对于远程主机审批，请直接使用 `openclaw approvals set --gateway` 或 `openclaw approvals set --node <id|name|ip>`。

## 常用命令

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`get` 会显示目标的有效 Exec 策略：请求的 `tools.exec` 策略、主机审批文件策略，以及合并后的有效结果。

优先级：

- 主机审批文件是可执行的事实来源。
- 请求的 `tools.exec` 策略可以收窄或放宽意图，但有效结果由主机规则推导。
- `--node` 会将节点主机审批文件与 Gateway 网关 `tools.exec` 策略结合使用（两者都会在运行时生效）。
- 如果 Gateway 网关配置不可用，CLI 会回退到节点审批快照，并提示无法计算最终运行时策略。

## 从文件替换审批

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` 接受 JSON5，而不只是严格 JSON。使用 `--file` 或 `--stdin` 其中之一，不要同时使用。

## “永不提示”/ YOLO 示例

对于不应因 Exec 审批而停止的主机，将主机审批默认值设置为 `full` + `off`：

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

节点变体：使用相同正文，并执行 `openclaw approvals set --node <id|name|ip> --stdin`。

这只会更改**主机审批文件**。要保持请求的 OpenClaw 策略一致，还需设置：

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

这里显式设置 `tools.exec.host=gateway`，因为 `host=auto` 仍表示“有沙箱时使用沙箱，否则使用 Gateway 网关”：YOLO 关注的是审批，而不是路由。当你即使配置了沙箱也想使用主机 Exec 时，请使用 `gateway`（或 `/exec host=gateway`）。

省略的 `askFallback` 默认值为 `deny`。升级应保持永不提示行为的无 UI 主机时，请显式设置 `askFallback: "full"`。

仅在本地机器上表达相同意图的本地快捷方式：

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

`get`、`set` 和 `allowlist add|remove` 都支持：

- `--node <id|name|ip>`（解析 ID、名称、IP 或 ID 前缀；与 `openclaw nodes` 使用相同解析器）
- `--gateway`
- 共享节点 RPC 选项：`--url`、`--token`、`--timeout`、`--json`

没有目标标志表示使用磁盘上的本地审批文件。

`allowlist add|remove` 还支持 `--agent <id>`（默认值为 `"*"`，适用于所有智能体）。

## 说明

- 节点主机必须公布 `system.execApprovals.get/set`（macOS 应用或无头节点主机）。
- 审批文件按主机存储在 OpenClaw 状态目录中：`$OPENCLAW_STATE_DIR/exec-approvals.json`；如果未设置该变量，则为 `~/.openclaw/exec-approvals.json`。

## 相关

- [CLI 参考](/zh-CN/cli)
- [Exec 审批](/zh-CN/tools/exec-approvals)
