---
read_when:
    - 使用或修改 exec 工具
    - 调试 stdin 或 TTY 行为
summary: Exec 工具用法、stdin 模式和 TTY 支持
title: Exec 工具
x-i18n:
    generated_at: "2026-04-27T11:02:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6b67f169d1cd7e529523d6c1c57a0f931dcb2e6c7ed93226b2feb38cad28756
    source_path: tools/exec.md
    workflow: 15
---

在工作区中运行 shell 命令。通过 `process` 支持前台 + 后台执行。
如果 `process` 被禁用，`exec` 会同步运行，并忽略 `yieldMs`/`background`。
后台会话按每个智能体隔离；`process` 只能看到同一智能体的会话。

## 参数

<ParamField path="command" type="string" required>
要运行的 shell 命令。
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
命令的工作目录。
</ParamField>

<ParamField path="env" type="object">
在继承环境之上合并的键/值环境覆盖。
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
在此延迟（毫秒）后自动将命令切换到后台。
</ParamField>

<ParamField path="background" type="boolean" default="false">
立即将命令切换到后台，而不是等待 `yieldMs`。
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
覆盖本次调用配置的 exec 超时时间。只有在命令应不受 exec 进程超时限制时，才设置 `timeout: 0`。
</ParamField>

<ParamField path="pty" type="boolean" default="false">
在可用时于伪终端中运行。用于仅支持 TTY 的 CLI、编码智能体和终端 UI。
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
执行位置。`auto` 会在沙箱运行时处于活动状态时解析为 `sandbox`，否则解析为 `gateway`。
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
`gateway` / `node` 执行的强制模式。
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
`gateway` / `node` 执行的审批提示行为。
</ParamField>

<ParamField path="node" type="string">
当 `host=node` 时的节点 ID/名称。
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
请求提升模式 —— 从沙箱逃逸到已配置的主机路径。只有当 elevated 解析为 `full` 时，才会强制 `security=full`。
</ParamField>

说明：

- `host` 默认为 `auto`：当会话的沙箱运行时处于活动状态时使用沙箱，否则使用 gateway。
- `auto` 是默认路由策略，不是通配符。可在单次调用中从 `auto` 使用 `host=node`；仅当没有活动沙箱运行时时，才允许在单次调用中使用 `host=gateway`。
- 在没有额外配置时，`host=auto` 仍然可以“直接工作”：没有沙箱时它会解析为 `gateway`；有活动沙箱时它会停留在沙箱中。
- `elevated` 会从沙箱逃逸到已配置的主机路径：默认是 `gateway`，或者当 `tools.exec.host=node`（或会话默认值是 `host=node`）时为 `node`。只有在当前会话/提供商启用了提升访问时，它才可用。
- `gateway`/`node` 审批由 `~/.openclaw/exec-approvals.json` 控制。
- `node` 需要一个已配对的节点（配套应用或无头节点主机）。
- 如果有多个节点可用，请设置 `exec.node` 或 `tools.exec.node` 进行选择。
- `exec host=node` 是节点唯一的 shell 执行路径；旧版 `nodes.run` 包装器已被移除。
- `timeout` 适用于前台、后台、`yieldMs`、gateway、sandbox 和 node `system.run` 执行。如果省略，OpenClaw 会使用 `tools.exec.timeoutSec`；显式 `timeout: 0` 会禁用该次调用的 exec 进程超时。
- 在非 Windows 主机上，exec 会在设置了 `SHELL` 时使用它；如果 `SHELL` 是 `fish`，它会优先从 `PATH` 中选择 `bash`（或 `sh`），以避免与 fish 不兼容的脚本，然后仅在两者都不存在时回退到 `SHELL`。
- 在 Windows 主机上，exec 会优先发现 PowerShell 7（`pwsh`）（依次检查 Program Files、ProgramW6432，然后是 PATH），之后再回退到 Windows PowerShell 5.1。
- 主机执行（`gateway`/`node`）会拒绝 `env.PATH` 和加载器覆盖（`LD_*`/`DYLD_*`），以防止二进制劫持或注入代码。
- OpenClaw 会在生成的命令环境中设置 `OPENCLAW_SHELL=exec`（包括 PTY 和沙箱执行），这样 shell/profile 规则就能检测 exec 工具上下文。
- 重要说明：沙箱隔离默认**关闭**。如果沙箱隔离关闭，隐式 `host=auto` 会解析为 `gateway`。显式 `host=sandbox` 仍会以关闭失败方式处理，而不是静默地在 gateway 主机上运行。请启用沙箱隔离，或结合审批使用 `host=gateway`。
- 脚本预检（用于常见的 Python/Node shell 语法错误）只会检查位于有效 `workdir` 边界内的文件。如果脚本路径解析到 `workdir` 之外，则会跳过该文件的预检。
- 对于现在开始的长时间运行工作，只需启动一次，并在启用了自动完成唤醒且命令输出内容或失败时依赖该机制。使用 `process` 查看日志、状态、输入或进行干预；不要用 sleep 循环、timeout 循环或重复轮询来模拟调度。
- 对于应该稍后或按计划执行的工作，请使用 cron，而不要使用 `exec` 的 sleep/delay 模式。

## 配置

- `tools.exec.notifyOnExit`（默认：true）：为 true 时，切换到后台的 exec 会话在退出时会入队一个系统事件并请求一次 heartbeat。
- `tools.exec.approvalRunningNoticeMs`（默认：10000）：当需要审批的 exec 运行时间超过此值时，发出一次“正在运行”通知（设为 0 可禁用）。
- `tools.exec.timeoutSec`（默认：1800）：每条命令的默认 exec 超时时间（秒）。单次调用的 `timeout` 会覆盖它；单次调用的 `timeout: 0` 会禁用 exec 进程超时。
- `tools.exec.host`（默认：`auto`；当沙箱运行时处于活动状态时解析为 `sandbox`，否则为 `gateway`）
- `tools.exec.security`（默认：对于 sandbox 为 `deny`，对于 gateway + node 在未设置时为 `full`）
- `tools.exec.ask`（默认：`off`）
- 无审批的主机 exec 是 gateway + node 的默认行为。如果你想使用审批/allowlist 行为，请同时收紧 `tools.exec.*` 和主机上的 `~/.openclaw/exec-approvals.json`；参见[Exec 审批](/zh-CN/tools/exec-approvals#no-approval-yolo-mode)。
- YOLO 来自主机策略默认值（`security=full`、`ask=off`），而不是 `host=auto`。如果你想强制 gateway 或 node 路由，请设置 `tools.exec.host` 或使用 `/exec host=...`。
- 在 `security=full` 加 `ask=off` 模式下，主机 exec 会直接遵循已配置策略；不会再有额外的启发式命令混淆预过滤器或脚本预检拒绝层。
- `tools.exec.node`（默认：未设置）
- `tools.exec.strictInlineEval`（默认：false）：为 true 时，内联解释器求值形式，例如 `python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e` 和 `osascript -e`，始终需要显式审批。`allow-always` 仍然可以持久化允许良性的解释器/脚本调用，但内联求值形式仍会每次都提示。
- `tools.exec.pathPrepend`：在 exec 运行时预添加到 `PATH` 的目录列表（仅 gateway + sandbox）。
- `tools.exec.safeBins`：无需显式 allowlist 条目即可运行的、仅 stdin 的安全二进制文件。行为细节请参见[Safe bins](/zh-CN/tools/exec-approvals-advanced#safe-bins-stdin-only)。
- `tools.exec.safeBinTrustedDirs`：用于 `safeBins` 路径检查的额外显式受信任目录。`PATH` 条目永远不会被自动信任。内置默认值是 `/bin` 和 `/usr/bin`。
- `tools.exec.safeBinProfiles`：针对自定义 safe bin 的可选自定义 argv 策略（`minPositional`、`maxPositional`、`allowedValueFlags`、`deniedFlags`）。

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

- `host=gateway`：将你的登录 shell `PATH` 合并到 exec 环境中。主机执行会拒绝 `env.PATH` 覆盖。守护进程本身仍以最小化 `PATH` 运行：
  - macOS：`/opt/homebrew/bin`、`/usr/local/bin`、`/usr/bin`、`/bin`
  - Linux：`/usr/local/bin`、`/usr/bin`、`/bin`
- `host=sandbox`：在容器内运行 `sh -lc`（登录 shell），因此 `/etc/profile` 可能会重置 `PATH`。OpenClaw 会在 profile source 完成后，通过内部环境变量将 `env.PATH` 预添加回去（无 shell 插值）；`tools.exec.pathPrepend` 在这里也会生效。
- `host=node`：只有你传入的、未被阻止的环境覆盖会被发送到节点。主机执行会拒绝 `env.PATH` 覆盖，节点主机也会忽略它。如果你需要在节点上添加额外的 PATH 条目，请配置节点主机服务环境（systemd/launchd），或将工具安装到标准位置。

按智能体绑定节点（在配置中使用智能体列表索引）：

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI：Nodes 标签页中也包含一个小型“Exec 节点绑定”面板，用于配置同样的设置。

## 会话覆盖（`/exec`）

使用 `/exec` 为**每个会话**设置 `host`、`security`、`ask` 和 `node` 的默认值。
不带参数发送 `/exec` 可显示当前值。

示例：

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## 授权模型

`/exec` 仅对**已授权发送者**生效（渠道 allowlist/配对加上 `commands.useAccessGroups`）。
它只更新**会话状态**，不会写入配置。若要彻底禁用 exec，请通过工具
策略拒绝它（`tools.deny: ["exec"]` 或按智能体配置）。
除非你显式设置 `security=full` 和 `ask=off`，否则主机审批仍然适用。

## Exec 审批（配套应用 / 节点主机）

沙箱隔离智能体可以要求在 `exec` 于 gateway 或 node 主机上运行前进行逐请求审批。
有关策略、allowlist 和 UI 流程，请参见[Exec 审批](/zh-CN/tools/exec-approvals)。

当需要审批时，exec 工具会立即返回，
并带有 `status: "approval-pending"` 和一个审批 ID。审批通过（或被拒绝 / 超时）后，
Gateway 网关会发出系统事件（`Exec finished` / `Exec denied`）。如果命令在
`tools.exec.approvalRunningNoticeMs` 之后仍在运行，则会发出一次 `Exec running` 通知。
在原生支持审批卡片/按钮的渠道上，智能体应优先依赖这种
原生 UI，只有当工具结果明确说明聊天审批不可用或手动审批是
唯一方式时，才应包含手动 `/approve` 命令。

## Allowlist + safe bins

手动 allowlist 强制匹配已解析的二进制路径 glob 和裸命令名
glob。裸名称只匹配通过 PATH 调用的命令，因此当命令是 `rg` 时，`rg` 可以匹配
`/opt/homebrew/bin/rg`，但不能匹配 `./rg` 或 `/tmp/rg`。
当 `security=allowlist` 时，只有当每个管道
片段都在 allowlist 中或属于 safe bin 时，shell 命令才会被自动允许。
在 allowlist 模式下，链式命令（`;`、`&&`、`||`）和重定向会被拒绝，除非每个顶层片段都满足
allowlist 规则（包括 safe bins）。重定向仍然不受支持。
持久化的 `allow-always` 信任也不会绕过该规则：链式命令仍然要求每个
顶层片段都匹配。

`autoAllowSkills` 是 exec 审批中的一条独立便捷路径。它不同于
手动路径 allowlist 条目。若要实现严格的显式信任，请保持 `autoAllowSkills` 禁用。

请将这两个控制项用于不同用途：

- `tools.exec.safeBins`：小型、仅 stdin 的流过滤二进制文件。
- `tools.exec.safeBinTrustedDirs`：safe bin 可执行路径的显式额外受信任目录。
- `tools.exec.safeBinProfiles`：自定义 safe bin 的显式 argv 策略。
- allowlist：对可执行路径的显式信任。

不要把 `safeBins` 当作通用 allowlist，也不要加入解释器/运行时二进制文件（例如 `python3`、`node`、`ruby`、`bash`）。如果你需要这些，请使用显式 allowlist 条目，并保持审批提示开启。
当解释器/运行时 `safeBins` 条目缺少显式 profile 时，`openclaw security audit` 会发出警告，而 `openclaw doctor --fix` 可以为缺失的自定义 `safeBinProfiles` 条目生成脚手架。
当你明确将 `jq` 之类的广泛行为二进制文件重新加入 `safeBins` 时，`openclaw security audit` 和 `openclaw doctor` 也会发出警告。
如果你显式将解释器加入 allowlist，请启用 `tools.exec.strictInlineEval`，这样内联代码求值形式仍然需要新的审批。

有关完整策略详情和示例，请参见 [Exec 审批](/zh-CN/tools/exec-approvals-advanced#safe-bins-stdin-only) 和 [Safe bins 与 allowlist 的区别](/zh-CN/tools/exec-approvals-advanced#safe-bins-versus-allowlist)。

## 示例

前台执行：

```json
{ "tool": "exec", "command": "ls -la" }
```

后台执行 + 轮询：

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

轮询用于按需查看状态，而不是用于等待循环。如果启用了自动完成唤醒，
当命令产生输出或失败时，它可以唤醒会话。

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

粘贴（默认使用 bracketed paste）：

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` 是 `exec` 的一个子工具，用于结构化的多文件编辑。
它默认对 OpenAI 和 OpenAI Codex 模型启用。只有当你想禁用它或将其限制到特定模型时，
才需要使用配置：

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

说明：

- 仅适用于 OpenAI/OpenAI Codex 模型。
- 工具策略仍然适用；`allow: ["write"]` 会隐式允许 `apply_patch`。
- 配置位于 `tools.exec.applyPatch` 下。
- `tools.exec.applyPatch.enabled` 默认是 `true`；将其设为 `false` 可对 OpenAI 模型禁用该工具。
- `tools.exec.applyPatch.workspaceOnly` 默认是 `true`（限制在工作区内）。只有当你明确希望 `apply_patch` 在工作区目录之外写入/删除时，才将其设为 `false`。

## 相关内容

- [Exec 审批](/zh-CN/tools/exec-approvals) — shell 命令的审批门控
- [沙箱隔离](/zh-CN/gateway/sandboxing) — 在沙箱隔离环境中运行命令
- [后台进程](/zh-CN/gateway/background-process) — 长时间运行的 exec 和 process 工具
- [安全性](/zh-CN/gateway/security) — 工具策略和提升访问
