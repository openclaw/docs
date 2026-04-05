---
read_when:
    - 使用或修改 exec 工具
    - 调试 stdin 或 TTY 行为
summary: Exec 工具用法、stdin 模式和 TTY 支持
title: Exec 工具
x-i18n:
    generated_at: "2026-04-05T10:11:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: b73e9900c109910fc4e178c888b7ad7f3a4eeaa34eb44bc816abba9af5d664d7
    source_path: tools/exec.md
    workflow: 15
---

# Exec 工具

在工作区中运行 shell 命令。通过 `process` 支持前台和后台执行。
如果 `process` 被禁止，`exec` 会同步运行，并忽略 `yieldMs`/`background`。
后台会话按智能体划分作用域；`process` 只能看到来自同一智能体的会话。

## 参数

- `command`（必填）
- `workdir`（默认为 cwd）
- `env`（键/值覆盖）
- `yieldMs`（默认 10000）：延迟后自动转为后台
- `background`（布尔值）：立即转为后台
- `timeout`（秒，默认 1800）：到期后终止
- `pty`（布尔值）：在可用时于伪终端中运行（仅 TTY CLI、编码智能体、终端 UI）
- `host`（`auto | sandbox | gateway | node`）：执行位置
- `security`（`deny | allowlist | full`）：`gateway`/`node` 的强制模式
- `ask`（`off | on-miss | always`）：`gateway`/`node` 的审批提示
- `node`（字符串）：用于 `host=node` 的节点 id/name
- `elevated`（布尔值）：请求 elevated 模式（从沙箱逃逸到已配置的主机路径）；只有当 elevated 解析为 `full` 时，才会强制 `security=full`

说明：

- `host` 默认为 `auto`：当会话的沙箱运行时处于活动状态时使用 sandbox，否则使用 gateway。
- `auto` 是默认路由策略，不是通配符。每次调用都允许从 `auto` 切换到 `host=node`；只有在没有活动沙箱运行时时，才允许每次调用切换到 `host=gateway`。
- 在没有额外配置时，`host=auto` 仍然能“直接工作”：没有沙箱时会解析到 `gateway`；有活动沙箱时则保持在沙箱中。
- `elevated` 会从沙箱逃逸到已配置的主机路径：默认是 `gateway`，或者当 `tools.exec.host=node`（或会话默认值为 `host=node`）时为 `node`。仅当当前会话/provider 启用了 elevated 访问时可用。
- `gateway`/`node` 审批由 `~/.openclaw/exec-approvals.json` 控制。
- `node` 需要已配对的节点（配套应用或无头节点主机）。
- 如果有多个可用节点，请设置 `exec.node` 或 `tools.exec.node` 来选择其中一个。
- `exec host=node` 是节点唯一的 shell 执行路径；旧版 `nodes.run` 包装器已移除。
- 在非 Windows 主机上，exec 在设置了 `SHELL` 时会使用它；如果 `SHELL` 是 `fish`，它会优先从
  `PATH` 中选择 `bash`（或 `sh`）以避免 fish 不兼容脚本，若两者都不存在，
  则回退到 `SHELL`。
- 在 Windows 主机上，exec 会优先发现 PowerShell 7（依次检查 Program Files、ProgramW6432、然后 PATH），
  然后再回退到 Windows PowerShell 5.1。
- 主机执行（`gateway`/`node`）会拒绝 `env.PATH` 和加载器覆盖（`LD_*`/`DYLD_*`），以
  防止二进制劫持或注入代码。
- OpenClaw 会在已启动命令的环境中设置 `OPENCLAW_SHELL=exec`（包括 PTY 和沙箱执行），这样 shell/profile 规则就能检测到 exec 工具上下文。
- 重要：沙箱隔离默认**关闭**。如果沙箱隔离关闭，隐式 `host=auto`
  会解析到 `gateway`。显式 `host=sandbox` 仍会以默认拒绝方式失败，而不是静默地
  改在 gateway 主机上运行。请启用沙箱隔离，或使用带审批的 `host=gateway`。
- 脚本预检（用于检测常见 Python/Node shell 语法错误）只会检查位于
  有效 `workdir` 边界内的文件。如果脚本路径解析到 `workdir` 之外，则会跳过对
  该文件的预检。
- 对于现在就开始的长时间运行任务，请只启动一次，并在启用了自动
  完成唤醒且命令有输出或失败时，依赖自动完成唤醒。
  使用 `process` 查看日志、状态、输入或进行干预；不要用
  sleep 循环、timeout 循环或重复轮询来模拟调度。
- 对于应在稍后或按计划发生的任务，请使用 cron，而不是
  `exec` 的 sleep/delay 模式。

## 配置

- `tools.exec.notifyOnExit`（默认：true）：为 true 时，转入后台的 exec 会话会在退出时将系统事件加入队列并请求一次心跳。
- `tools.exec.approvalRunningNoticeMs`（默认：10000）：当需要审批的 exec 运行时间超过该值时，发出一次“正在运行”通知（设为 0 可禁用）。
- `tools.exec.host`（默认：`auto`；当沙箱运行时处于活动状态时解析为 `sandbox`，否则为 `gateway`）
- `tools.exec.security`（默认：对 sandbox 为 `deny`，对 gateway + node 在未设置时为 `full`）
- `tools.exec.ask`（默认：`off`）
- 无审批的主机 exec 是 gateway + node 的默认行为。如果你希望使用审批/allowlist 行为，请同时收紧 `tools.exec.*` 和主机上的 `~/.openclaw/exec-approvals.json`；参见 [Exec 审批](/zh-CN/tools/exec-approvals#no-approval-yolo-mode)。
- YOLO 来自主机策略默认值（`security=full`、`ask=off`），而不是 `host=auto`。如果你想强制使用 gateway 或 node 路由，请设置 `tools.exec.host` 或使用 `/exec host=...`。
- `tools.exec.node`（默认：未设置）
- `tools.exec.strictInlineEval`（默认：false）：为 true 时，内联解释器求值形式如 `python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e` 和 `osascript -e` 总是需要显式审批。`allow-always` 仍可持久允许良性的解释器/脚本调用，但内联求值形式每次仍会提示。
- `tools.exec.pathPrepend`：要在 exec 运行时前置到 `PATH` 中的目录列表（仅 gateway + sandbox）。
- `tools.exec.safeBins`：仅 stdin 的安全二进制，可在没有显式 allowlist 条目的情况下运行。行为详情请参见 [安全二进制](/zh-CN/tools/exec-approvals#safe-bins-stdin-only)。
- `tools.exec.safeBinTrustedDirs`：为 `safeBins` 路径检查额外显式信任的目录。`PATH` 条目永远不会被自动信任。内置默认值为 `/bin` 和 `/usr/bin`。
- `tools.exec.safeBinProfiles`：为自定义安全二进制提供可选的自定义 argv 策略（`minPositional`、`maxPositional`、`allowedValueFlags`、`deniedFlags`）。

示例：

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### PATH 处理

- `host=gateway`：将你的 login-shell `PATH` 合并到 exec 环境中。`env.PATH` 覆盖会被
  拒绝用于主机执行。守护进程本身仍以最小化 `PATH` 运行：
  - macOS：`/opt/homebrew/bin`、`/usr/local/bin`、`/usr/bin`、`/bin`
  - Linux：`/usr/local/bin`、`/usr/bin`、`/bin`
- `host=sandbox`：在容器内运行 `sh -lc`（login shell），因此 `/etc/profile` 可能会重置 `PATH`。
  OpenClaw 会在 profile 加载之后通过内部环境变量前置 `env.PATH`（不经过 shell 插值）；
  `tools.exec.pathPrepend` 在这里同样生效。
- `host=node`：只会将你传入的、未被阻止的环境变量覆盖发送到节点。`env.PATH` 覆盖会被
  拒绝用于主机执行，并会被节点主机忽略。如果你需要在节点上添加额外的 PATH 条目，
  请配置节点主机服务环境（systemd/launchd），或将工具安装到标准位置。

每智能体节点绑定（在配置中使用智能体列表索引）：

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

控制 UI：Nodes 标签页包含一个小型 “Exec node binding” 面板，用于相同设置。

## 会话覆盖（`/exec`）

使用 `/exec` 设置 **按会话** 生效的 `host`、`security`、`ask` 和 `node` 默认值。
发送不带参数的 `/exec` 可显示当前值。

示例：

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## 授权模型

`/exec` 仅对**已授权发送者**生效（渠道 allowlists/配对加上 `commands.useAccessGroups`）。
它只更新**会话状态**，不会写入配置。若要硬禁用 exec，请通过工具
策略拒绝它（`tools.deny: ["exec"]` 或每智能体配置）。除非你显式设置
`security=full` 且 `ask=off`，否则主机审批仍会生效。

## Exec 审批（配套应用 / 节点主机）

沙箱隔离智能体可以在 exec 于 gateway 或节点主机上运行之前，要求每次请求都进行审批。
策略、allowlist 和 UI 流程请参见 [Exec 审批](/zh-CN/tools/exec-approvals)。

当需要审批时，exec 工具会立即返回
`status: "approval-pending"` 和一个审批 id。一旦被批准（或被拒绝 / 超时），
Gateway 网关会发出系统事件（`Exec finished` / `Exec denied`）。如果命令在
`tools.exec.approvalRunningNoticeMs` 之后仍在运行，则会发出一次 `Exec running`
通知。在支持原生审批卡片/按钮的渠道上，智能体应优先依赖该
原生 UI，只有当工具结果明确说明聊天内审批不可用或手动审批是唯一
路径时，才应附带手动 `/approve` 命令。

## Allowlist + 安全二进制

手动 allowlist 强制仅匹配**已解析的二进制路径**（不匹配 basename）。当
`security=allowlist` 时，只有在管道中的每个片段都已
加入 allowlist 或属于安全二进制时，shell 命令才会被自动允许。链式执行（`;`、`&&`、`||`）和重定向在
allowlist 模式下会被拒绝，除非每个顶层片段都满足 allowlist（包括安全二进制）。
重定向仍然不受支持。
持久化的 `allow-always` 信任不会绕过该规则：链式命令仍要求每个
顶层片段都匹配。

`autoAllowSkills` 是 exec 审批中的独立便捷路径。它不同于
手动路径 allowlist 条目。若要实现严格显式信任，请保持 `autoAllowSkills` 禁用。

针对不同任务，请使用这两种控制方式：

- `tools.exec.safeBins`：小型、仅 stdin 的流过滤二进制。
- `tools.exec.safeBinTrustedDirs`：为安全二进制可执行路径提供的显式额外信任目录。
- `tools.exec.safeBinProfiles`：为自定义安全二进制提供的显式 argv 策略。
- allowlist：对可执行路径的显式信任。

不要把 `safeBins` 当作通用 allowlist 使用，也不要添加解释器/运行时二进制（例如 `python3`、`node`、`ruby`、`bash`）。如果你需要这些，请使用显式 allowlist 条目，并保持审批提示启用。
当解释器/运行时 `safeBins` 条目缺少显式配置时，`openclaw security audit` 会发出警告，而 `openclaw doctor --fix` 可以为缺失的自定义 `safeBinProfiles` 条目生成脚手架。
当你显式将诸如 `jq` 这类行为广泛的二进制重新加入 `safeBins` 时，`openclaw security audit` 和 `openclaw doctor` 也会发出警告。
如果你显式将解释器加入 allowlist，请启用 `tools.exec.strictInlineEval`，以便内联代码求值形式仍然需要新的审批。

完整策略详情和示例，请参见 [Exec 审批](/zh-CN/tools/exec-approvals#safe-bins-stdin-only) 和 [安全二进制与 allowlist 的区别](/zh-CN/tools/exec-approvals#safe-bins-versus-allowlist)。

## 示例

前台：

```json
{ "tool": "exec", "command": "ls -la" }
```

后台 + 轮询：

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

轮询用于按需查看状态，而不是等待循环。如果启用了自动完成唤醒，
当命令有输出或失败时，它可以唤醒会话。

发送按键（tmux 风格）：

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

提交（仅发送 CR）：

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

粘贴（默认带括号）：

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` 是 `exec` 的一个子工具，用于结构化的多文件编辑。
它默认对 OpenAI 和 OpenAI Codex 模型启用。仅当你想
禁用它或将其限制给特定模型时，才需要使用配置：

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.4"] },
    },
  },
}
```

说明：

- 仅适用于 OpenAI/OpenAI Codex 模型。
- 工具策略仍然适用；`allow: ["write"]` 会隐式允许 `apply_patch`。
- 配置位于 `tools.exec.applyPatch` 下。
- `tools.exec.applyPatch.enabled` 默认为 `true`；将其设为 `false` 可为 OpenAI 模型禁用该工具。
- `tools.exec.applyPatch.workspaceOnly` 默认为 `true`（限制在工作区内）。只有当你有意希望 `apply_patch` 在工作区目录之外写入/删除时，才将其设为 `false`。

## 相关内容

- [Exec 审批](/zh-CN/tools/exec-approvals) —— shell 命令的审批门槛
- [沙箱隔离](/zh-CN/gateway/sandboxing) —— 在沙箱隔离环境中运行命令
- [后台进程](/zh-CN/gateway/background-process) —— 长时间运行的 exec 和 process 工具
- [安全](/zh-CN/gateway/security) —— 工具策略和 elevated 访问
