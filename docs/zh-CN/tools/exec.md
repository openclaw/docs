---
read_when:
    - 使用或修改 exec 工具
    - 调试 stdin 或 TTY 行为
summary: Exec 工具用法、stdin 模式和 TTY 支持
title: Exec Tool
x-i18n:
    generated_at: "2026-04-21T06:26:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5018468f31bb76fc142ddef7002c7bbc617406de7ce912670d1b9edef6a9a042
    source_path: tools/exec.md
    workflow: 15
---

# Exec 工具

在工作区中运行 shell 命令。通过 `process` 支持前台和后台执行。
如果 `process` 不被允许，`exec` 会同步运行，并忽略 `yieldMs`/`background`。
后台会话按智能体隔离；`process` 只能看到来自同一智能体的会话。

## 参数

- `command`（必需）
- `workdir`（默认为当前工作目录）
- `env`（键/值覆盖）
- `yieldMs`（默认 10000）：延迟后自动转入后台
- `background`（布尔值）：立即转入后台
- `timeout`（秒，默认 1800）：到期后终止
- `pty`（布尔值）：在可用时于伪终端中运行（仅限 TTY 的 CLI、编码智能体、终端 UI）
- `host`（`auto | sandbox | gateway | node`）：执行位置
- `security`（`deny | allowlist | full`）：`gateway`/`node` 的执行模式
- `ask`（`off | on-miss | always`）：`gateway`/`node` 的审批提示
- `node`（字符串）：用于 `host=node` 的节点 id/名称
- `elevated`（布尔值）：请求提升模式（从沙箱逃逸到已配置的主机路径）；仅当 `elevated` 最终解析为 `full` 时，才会强制 `security=full`

注意：

- `host` 默认为 `auto`：当会话启用了沙箱运行时时使用 `sandbox`，否则使用 `gateway`。
- `auto` 是默认路由策略，不是通配符。可以在单次调用中使用 `host=node`；只有在当前没有启用沙箱运行时时，才允许单次调用使用 `host=gateway`。
- 在没有额外配置时，`host=auto` 依然可以“开箱即用”：没有沙箱时会解析为 `gateway`；有正在运行的沙箱时则保持在沙箱内。
- `elevated` 会从沙箱逃逸到已配置的主机路径：默认是 `gateway`，或者当 `tools.exec.host=node`（或会话默认是 `host=node`）时为 `node`。只有在当前会话/提供商启用了提升访问时，这个选项才可用。
- `gateway`/`node` 的审批由 `~/.openclaw/exec-approvals.json` 控制。
- `node` 需要一个已配对的节点（配套应用或无头节点主机）。
- 如果有多个可用节点，请设置 `exec.node` 或 `tools.exec.node` 进行选择。
- `exec host=node` 是节点上唯一的 shell 执行路径；旧版 `nodes.run` 包装器已移除。
- 在非 Windows 主机上，exec 会优先使用已设置的 `SHELL`；如果 `SHELL` 是 `fish`，它会优先从 `PATH` 中选择 `bash`（或 `sh`），以避免不兼容 `fish` 的脚本，然后才会在两者都不存在时回退到 `SHELL`。
- 在 Windows 主机上，exec 会优先发现 PowerShell 7（依次检查 Program Files、ProgramW6432，然后是 `PATH`），然后回退到 Windows PowerShell 5.1。
- 主机执行（`gateway`/`node`）会拒绝 `env.PATH` 和加载器覆盖（`LD_*`/`DYLD_*`），以防止二进制劫持或注入代码。
- OpenClaw 会在启动的命令环境中设置 `OPENCLAW_SHELL=exec`（包括 PTY 和沙箱执行），这样 shell/配置文件规则就可以检测到 exec 工具上下文。
- 重要：沙箱隔离默认**关闭**。如果沙箱隔离关闭，隐式 `host=auto` 会解析为 `gateway`。显式 `host=sandbox` 仍会以安全关闭方式失败，而不是静默地在 gateway 主机上运行。请启用沙箱隔离，或结合审批使用 `host=gateway`。
- 脚本预检（用于发现常见的 Python/Node shell 语法错误）只会检查位于有效 `workdir` 边界内的文件。如果某个脚本路径解析到 `workdir` 之外，则会跳过该文件的预检。
- 对于现在开始的长时间运行任务，只需启动一次，并在启用了自动完成唤醒且命令有输出或失败时依赖自动唤醒即可。
  对日志、状态、输入或人工干预，请使用 `process`；不要用 sleep 循环、timeout 循环或重复轮询来模拟调度。
- 对于应稍后执行或按计划执行的任务，请使用 cron，而不是用 `exec` 的 sleep/延迟模式。

## 配置

- `tools.exec.notifyOnExit`（默认：true）：为 true 时，转入后台的 exec 会话在退出时会将系统事件加入队列并请求一次心跳。
- `tools.exec.approvalRunningNoticeMs`（默认：10000）：当需要审批的 exec 运行时间超过该值时，发出一次“正在运行”通知（设为 0 则禁用）。
- `tools.exec.host`（默认：`auto`；当沙箱运行时启用时解析为 `sandbox`，否则解析为 `gateway`）
- `tools.exec.security`（默认：沙箱为 `deny`，`gateway` 和 `node` 在未设置时为 `full`）
- `tools.exec.ask`（默认：`off`）
- 对 `gateway` 和 `node`，默认是无需审批的主机 exec。如果你想启用审批/allowlist 行为，请同时收紧 `tools.exec.*` 和主机上的 `~/.openclaw/exec-approvals.json`；参见 [Exec 审批](/zh-CN/tools/exec-approvals#no-approval-yolo-mode)。
- YOLO 来自主机策略默认值（`security=full`、`ask=off`），而不是来自 `host=auto`。如果你想强制走 `gateway` 或 `node` 路由，请设置 `tools.exec.host` 或使用 `/exec host=...`。
- 在 `security=full` 且 `ask=off` 模式下，主机 exec 会直接遵循已配置策略；不存在额外的启发式命令混淆预过滤器，也不存在额外的脚本预检拒绝层。
- `tools.exec.node`（默认：未设置）
- `tools.exec.strictInlineEval`（默认：false）：为 true 时，内联解释器求值形式，如 `python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e` 和 `osascript -e`，始终需要显式审批。`allow-always` 仍可持久化允许无害的解释器/脚本调用，但内联求值形式每次仍会提示。
- `tools.exec.pathPrepend`：在 exec 运行时添加到 `PATH` 前面的目录列表（仅 `gateway` 和 `sandbox`）。
- `tools.exec.safeBins`：仅处理 stdin 的安全二进制文件，可在没有显式 allowlist 条目的情况下运行。行为详情见 [Safe bins](/zh-CN/tools/exec-approvals#safe-bins-stdin-only)。
- `tools.exec.safeBinTrustedDirs`：用于 `safeBins` 路径检查的其他显式可信目录。`PATH` 条目永远不会自动视为可信。内置默认值是 `/bin` 和 `/usr/bin`。
- `tools.exec.safeBinProfiles`：为自定义 safe bin 提供的可选自定义 argv 策略（`minPositional`、`maxPositional`、`allowedValueFlags`、`deniedFlags`）。

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

- `host=gateway`：会将你的登录 shell `PATH` 合并到 exec 环境中。主机执行会拒绝 `env.PATH` 覆盖。守护进程本身仍使用最小化的 `PATH`：
  - macOS：`/opt/homebrew/bin`、`/usr/local/bin`、`/usr/bin`、`/bin`
  - Linux：`/usr/local/bin`、`/usr/bin`、`/bin`
- `host=sandbox`：在容器内运行 `sh -lc`（登录 shell），因此 `/etc/profile` 可能会重置 `PATH`。
  OpenClaw 会在配置文件加载完成后通过内部环境变量把 `env.PATH` 追加到前面（不进行 shell 插值）；`tools.exec.pathPrepend` 也会在这里生效。
- `host=node`：只会将你传入且未被阻止的环境变量覆盖发送到节点。主机执行会拒绝 `env.PATH` 覆盖，节点主机也会忽略它。如果你需要在节点上增加额外的 PATH 条目，请配置节点主机服务环境（systemd/launchd），或将工具安装到标准位置。

按智能体绑定节点（在配置中使用智能体列表索引）：

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

控制 UI：Nodes 选项卡包含一个小型的“Exec 节点绑定”面板，用于配置同样的设置。

## 会话级覆盖（`/exec`）

使用 `/exec` 为 `host`、`security`、`ask` 和 `node` 设置**每个会话**的默认值。
发送不带参数的 `/exec` 可显示当前值。

示例：

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## 授权模型

`/exec` 只对**已授权的发送者**生效（渠道 allowlist/配对 加上 `commands.useAccessGroups`）。
它只会更新**会话状态**，不会写入配置。若要彻底禁用 exec，请通过工具策略拒绝它
（`tools.deny: ["exec"]` 或按智能体设置）。除非你显式设置 `security=full` 和 `ask=off`，否则主机审批仍然适用。

## Exec 审批（配套应用 / 节点主机）

沙箱隔离的智能体可以要求每次请求都先获得审批，之后才允许 `exec` 在 gateway 或节点主机上运行。
关于策略、allowlist 和 UI 流程，请参见 [Exec 审批](/zh-CN/tools/exec-approvals)。

当需要审批时，exec 工具会立即返回，
并带有 `status: "approval-pending"` 和一个审批 id。一旦获批（或被拒绝 / 超时），
Gateway 网关会发出系统事件（`Exec finished` / `Exec denied`）。如果命令在
`tools.exec.approvalRunningNoticeMs` 之后仍在运行，则会发出一次 `Exec running` 通知。
在原生支持审批卡片/按钮的渠道中，智能体应优先依赖该原生 UI，
只有当工具结果明确说明聊天审批不可用，或手动审批是唯一方式时，
才应附带手动 `/approve` 命令。

## allowlist + safe bins

手动 allowlist 强制仅匹配**已解析的二进制路径**（不匹配 basename）。当
`security=allowlist` 时，仅当管道中的每个片段都在 allowlist 中
或属于 safe bin 时，shell 命令才会被自动允许。在 allowlist 模式下，
链式命令（`;`、`&&`、`||`）和重定向会被拒绝，除非每个顶层片段都满足 allowlist 要求
（包括 safe bins）。重定向仍然不受支持。
持久化的 `allow-always` 信任不会绕过这条规则：链式命令仍然要求每个
顶层片段都匹配。

`autoAllowSkills` 是 exec 审批中的一条独立便捷路径。它不同于
手动路径 allowlist 条目。若要实现严格的显式信任，请保持
`autoAllowSkills` 为禁用状态。

请将这两类控制分别用于不同目的：

- `tools.exec.safeBins`：小型、仅处理 stdin 的流过滤器。
- `tools.exec.safeBinTrustedDirs`：safe bin 可执行路径的显式额外可信目录。
- `tools.exec.safeBinProfiles`：自定义 safe bin 的显式 argv 策略。
- allowlist：对可执行路径的显式信任。

不要把 `safeBins` 当作通用 allowlist，也不要添加解释器/运行时二进制文件（例如 `python3`、`node`、`ruby`、`bash`）。如果你需要这些，请使用显式 allowlist 条目，并保持审批提示开启。
如果解释器/运行时 `safeBins` 条目缺少显式 profile，`openclaw security audit` 会发出警告，而 `openclaw doctor --fix` 可以为缺失的自定义 `safeBinProfiles` 条目生成脚手架。
如果你又把 `jq` 这类行为宽泛的二进制文件显式加回 `safeBins`，`openclaw security audit` 和 `openclaw doctor` 也会发出警告。
如果你显式将解释器加入 allowlist，请启用 `tools.exec.strictInlineEval`，这样内联代码求值形式仍然需要新的审批。

完整策略细节和示例，请参见 [Exec 审批](/zh-CN/tools/exec-approvals#safe-bins-stdin-only) 和 [Safe bins 与 allowlist 的区别](/zh-CN/tools/exec-approvals#safe-bins-versus-allowlist)。

## 示例

前台运行：

```json
{ "tool": "exec", "command": "ls -la" }
```

后台运行 + 轮询：

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

轮询用于按需查看状态，不应用于等待循环。如果启用了自动完成唤醒，
当命令输出内容或失败时，它可以唤醒会话。

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

粘贴（默认带 bracketed paste）：

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` 是 `exec` 的一个子工具，用于结构化的多文件编辑。
它默认对 OpenAI 和 OpenAI Codex 模型启用。只有在你想禁用它
或将其限制为特定模型时，才需要使用配置：

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.4"] },
    },
  },
}
```

注意：

- 仅适用于 OpenAI/OpenAI Codex 模型。
- 工具策略仍然适用；`allow: ["write"]` 会隐式允许 `apply_patch`。
- 配置位于 `tools.exec.applyPatch`。
- `tools.exec.applyPatch.enabled` 默认值为 `true`；如需对 OpenAI 模型禁用该工具，请将其设为 `false`。
- `tools.exec.applyPatch.workspaceOnly` 默认值为 `true`（限制在工作区内）。只有在你明确希望 `apply_patch` 在工作区目录之外写入/删除内容时，才应将其设为 `false`。

## 相关内容

- [Exec 审批](/zh-CN/tools/exec-approvals) — shell 命令的审批门控
- [沙箱隔离](/zh-CN/gateway/sandboxing) — 在沙箱隔离环境中运行命令
- [后台进程](/zh-CN/gateway/background-process) — 长时间运行的 exec 和 process 工具
- [安全](/zh-CN/gateway/security) — 工具策略和提升访问权限
