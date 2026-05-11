---
read_when:
    - 使用或修改 Exec 工具
    - 调试 stdin 或 TTY 行为
summary: Exec 工具用法、stdin 模式和 TTY 支持
title: Exec 工具
x-i18n:
    generated_at: "2026-05-11T20:34:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43ed3dc70d1998f2f2a3eed70aaf20da61ba93d23b7fa7d378f22e8635c6ec68
    source_path: tools/exec.md
    workflow: 16
---

在工作区中运行 shell 命令。`exec` 是一个可变更的 shell 表面：只要所选主机或沙箱文件系统允许，命令就可以创建、编辑或删除文件。禁用 OpenClaw 文件系统工具（例如 `write`、`edit` 或 `apply_patch`）不会让 `exec` 变成只读。

通过 `process` 支持前台 + 后台执行。如果不允许使用 `process`，`exec` 会同步运行，并忽略 `yieldMs`/`background`。
后台会话按智能体限定范围；`process` 只能看到同一智能体的会话。

## 参数

<ParamField path="command" type="string" required>
要运行的 Shell 命令。
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
命令的工作目录。
</ParamField>

<ParamField path="env" type="object">
键/值环境覆盖项，会合并到继承的环境之上。
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
在此延迟（毫秒）后自动将命令转入后台。
</ParamField>

<ParamField path="background" type="boolean" default="false">
立即将命令转入后台，而不是等待 `yieldMs`。
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
覆盖本次调用配置的 exec 超时时间。仅当命令应在没有 exec 进程超时限制的情况下运行时，才设置 `timeout: 0`。
</ParamField>

<ParamField path="pty" type="boolean" default="false">
可用时在伪终端中运行。用于仅支持 TTY 的 CLI、编码智能体和终端 UI。
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
执行位置。`auto` 会在沙箱运行时处于活动状态时解析为 `sandbox`，否则解析为 `gateway`。
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
普通工具调用会忽略此项。`gateway` / `node` 的安全性由
`tools.exec.security` 和 `~/.openclaw/exec-approvals.json` 控制；提升模式只有在操作员明确授予提升访问权限时，才能强制 `security=full`。
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
`gateway` / `node` 执行的审批提示行为。
</ParamField>

<ParamField path="node" type="string">
当 `host=node` 时使用的节点 id/名称。
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
请求提升模式 — 逃逸沙箱并进入配置的主机路径。只有当 elevated 解析为 `full` 时，才会强制 `security=full`。
</ParamField>

注意事项：

- `host` 默认为 `auto`：当会话的沙箱运行时处于活动状态时使用沙箱，否则使用 Gateway 网关。
- `host` 只接受 `auto`、`sandbox`、`gateway` 或 `node`。它不是主机名选择器；类似主机名的值会在命令运行前被拒绝。
- `auto` 是默认路由策略，不是通配符。从 `auto` 可以按调用使用 `host=node`；只有在没有沙箱运行时处于活动状态时，才允许按调用使用 `host=gateway`。
- 没有额外配置时，`host=auto` 仍然可以“直接工作”：没有沙箱意味着它解析为 `gateway`；有实时沙箱意味着它留在沙箱中。
- `elevated` 会逃逸沙箱并进入配置的主机路径：默认是 `gateway`，或者当 `tools.exec.host=node`（或会话默认值为 `host=node`）时是 `node`。它仅在当前会话/提供商启用提升访问权限时可用。
- `gateway`/`node` 审批由 `~/.openclaw/exec-approvals.json` 控制。
- `node` 需要已配对的节点（配套应用或无头节点主机）。
- 如果有多个节点可用，请设置 `exec.node` 或 `tools.exec.node` 以选择一个。
- `exec host=node` 是节点的唯一 shell 执行路径；旧版 `nodes.run` 包装器已移除。
- `timeout` 适用于前台、后台、`yieldMs`、Gateway 网关、沙箱以及节点 `system.run` 执行。如果省略，OpenClaw 会使用 `tools.exec.timeoutSec`；显式的 `timeout: 0` 会禁用该调用的 exec 进程超时。
- 在非 Windows 主机上，exec 会在设置了 `SHELL` 时使用它；如果 `SHELL` 是 `fish`，它会优先使用 `PATH` 中的 `bash`（或 `sh`）
  以避免与 fish 不兼容的脚本，然后在两者都不存在时回退到 `SHELL`。
- 在 Windows 主机上，exec 优先发现 PowerShell 7（`pwsh`）（Program Files、ProgramW6432，然后是 PATH），
  然后回退到 Windows PowerShell 5.1。
- 主机执行（`gateway`/`node`）会拒绝 `env.PATH` 和加载器覆盖项（`LD_*`/`DYLD_*`），以
  防止二进制劫持或注入代码。
- OpenClaw 会在派生的命令环境中（包括 PTY 和沙箱执行）设置 `OPENCLAW_SHELL=exec`，这样 shell/profile 规则就可以检测 exec 工具上下文。
- `openclaw channels login` 会被 `exec` 阻止，因为它是交互式频道认证流程；请在 Gateway 网关主机上的终端中运行它，或者在存在频道原生登录工具时从聊天中使用该工具。
- 重要：沙箱隔离**默认关闭**。如果沙箱隔离关闭，隐式 `host=auto`
  会解析为 `gateway`。显式 `host=sandbox` 仍会失败关闭，而不是静默
  在 Gateway 网关主机上运行。启用沙箱隔离，或使用带审批的 `host=gateway`。
- 脚本预检（针对常见 Python/Node shell 语法错误）只检查有效 `workdir` 边界内的文件。如果脚本路径解析到 `workdir` 之外，
  则会跳过该文件的预检。
- 对于现在开始的长时间运行工作，启动一次即可，并在启用自动
  完成唤醒且命令发出输出或失败时依赖它。
  使用 `process` 查看日志、状态、输入或进行干预；不要用
  sleep 循环、timeout 循环或重复轮询来模拟调度。
- 对于应在稍后或按计划发生的工作，请使用 cron，而不是
  `exec` sleep/延迟模式。

## 配置

- `tools.exec.notifyOnExit`（默认值：true）：为 true 时，转入后台的 exec 会话会在退出时入队一个系统事件并请求 Heartbeat。
- `tools.exec.approvalRunningNoticeMs`（默认值：10000）：当受审批限制的 exec 运行时间超过此值时发出一次“running”通知（0 表示禁用）。
- `tools.exec.timeoutSec`（默认值：1800）：默认的每命令 exec 超时时间，单位为秒。按调用的 `timeout` 会覆盖它；按调用的 `timeout: 0` 会禁用 exec 进程超时。
- `tools.exec.host`（默认值：`auto`；当沙箱运行时处于活动状态时解析为 `sandbox`，否则解析为 `gateway`）
- `tools.exec.security`（默认值：沙箱为 `deny`，未设置时 Gateway 网关 + 节点为 `full`）
- `tools.exec.ask`（默认值：`off`）
- 无审批主机 exec 是 Gateway 网关 + 节点的默认行为。如果你想要审批/允许列表行为，请同时收紧 `tools.exec.*` 和主机 `~/.openclaw/exec-approvals.json`；请参阅 [Exec approvals](/zh-CN/tools/exec-approvals#yolo-mode-no-approval)。
- YOLO 来自主机策略默认值（`security=full`、`ask=off`），而不是来自 `host=auto`。如果你想强制 Gateway 网关或节点路由，请设置 `tools.exec.host` 或使用 `/exec host=...`。
- 在 `security=full` 加 `ask=off` 模式下，主机 exec 会直接遵循配置的策略；没有额外的启发式命令混淆预过滤器或脚本预检拒绝层。
- `tools.exec.node`（默认值：未设置）
- `tools.exec.strictInlineEval`（默认值：false）：为 true 时，内联解释器 eval 形式（例如 `python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e` 和 `osascript -e`）始终需要显式审批。`allow-always` 仍可持久保存良性的解释器/脚本调用，但内联 eval 形式每次仍会提示。
- `tools.exec.commandHighlighting`（默认值：false）：为 true 时，审批提示可以在命令文本中突出显示由解析器推导出的命令范围。全局或按智能体设置为 `true`，即可启用命令文本高亮，而不改变 exec 审批策略。
- `tools.exec.pathPrepend`：要为 exec 运行前置到 `PATH` 的目录列表（仅限 Gateway 网关 + 沙箱）。
- `tools.exec.safeBins`：仅 stdin 的安全二进制文件，可在没有显式允许列表条目的情况下运行。行为详情请参阅 [Safe bins](/zh-CN/tools/exec-approvals-advanced#safe-bins-stdin-only)。
- `tools.exec.safeBinTrustedDirs`：用于 `safeBins` 路径检查的额外显式信任目录。`PATH` 条目永远不会自动受信任。内置默认值是 `/bin` 和 `/usr/bin`。
- `tools.exec.safeBinProfiles`：每个安全二进制文件的可选自定义 argv 策略（`minPositional`、`maxPositional`、`allowedValueFlags`、`deniedFlags`）。

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

- `host=gateway`：将你的登录 shell `PATH` 合并到 exec 环境中。主机执行会
  拒绝 `env.PATH` 覆盖项。守护进程本身仍使用最小化 `PATH` 运行：
  - macOS：`/opt/homebrew/bin`、`/usr/local/bin`、`/usr/bin`、`/bin`
  - Linux：`/usr/local/bin`、`/usr/bin`、`/bin`
- `host=sandbox`：在容器内运行 `sh -lc`（登录 shell），因此 `/etc/profile` 可能会重置 `PATH`。
  OpenClaw 会通过内部环境变量（无 shell 插值）在 profile 加载后前置 `env.PATH`；
  `tools.exec.pathPrepend` 也适用于此处。
- `host=node`：只会把你传入的未被阻止的环境覆盖项发送到节点。主机执行会
  拒绝 `env.PATH` 覆盖项，节点主机也会忽略它们。如果你需要在节点上添加额外 PATH 条目，
  请配置节点主机服务环境（systemd/launchd），或将工具安装到标准位置。

按智能体绑定节点（在配置中使用智能体列表索引）：

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

控制 UI：Nodes 选项卡包含一个小型“Exec node binding”面板，用于相同设置。

## 会话覆盖项（`/exec`）

使用 `/exec` 设置 `host`、`security`、`ask` 和 `node` 的**按会话**默认值。
发送不带参数的 `/exec` 可显示当前值。

示例：

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## 授权模型

`/exec` 仅对**授权发送者**生效（频道允许列表/配对加 `commands.useAccessGroups`）。
它只更新**会话状态**，不会写入配置。要硬性禁用 exec，请通过工具
策略拒绝它（`tools.deny: ["exec"]` 或按智能体设置）。主机审批仍会适用，除非你显式设置
`security=full` 和 `ask=off`。

## Exec 审批（配套应用 / 节点主机）

沙箱隔离的智能体可以要求在 `exec` 运行于 Gateway 网关或节点主机之前进行逐请求审批。
有关策略、允许列表和 UI 流程，请参阅 [Exec approvals](/zh-CN/tools/exec-approvals)。

需要审批时，exec 工具会立即返回
`status: "approval-pending"` 和一个审批 id。审批通过（或拒绝/超时）后，
Gateway 网关会发出系统事件（`Exec finished` / `Exec denied`）。如果命令在
`tools.exec.approvalRunningNoticeMs` 之后仍在运行，则会发出一次 `Exec running` 通知。
在带有原生审批卡片/按钮的渠道中，智能体应优先依赖该
原生 UI，并且只有当工具结果明确表示聊天审批不可用或手动审批是
唯一路径时，才包含手动 `/approve` 命令。

## 允许列表 + 安全二进制文件

手动允许列表强制执行会匹配解析后的二进制路径 glob 和裸命令名称
glob。裸名称只匹配通过 PATH 调用的命令，因此当命令是 `rg` 时，`rg` 可以匹配
`/opt/homebrew/bin/rg`，但不能匹配 `./rg` 或 `/tmp/rg`。
当 `security=allowlist` 时，只有每个管道
段都在允许列表中或是安全二进制文件时，shell 命令才会被自动允许。链接（`;`、`&&`、`||`）和重定向
在允许列表模式下会被拒绝，除非每个顶层段都满足
允许列表（包括安全二进制文件）。重定向仍不受支持。
持久的 `allow-always` 信任不会绕过该规则：链式命令仍要求每个
顶层段匹配。

`autoAllowSkills` 是 exec 审批中的一个独立便捷路径。它不同于
手动路径允许列表条目。若需要严格的显式信任，请保持 `autoAllowSkills` 禁用。

将这两个控制项用于不同任务：

- `tools.exec.safeBins`：小型、仅通过 stdin 使用的流式过滤器。
- `tools.exec.safeBinTrustedDirs`：用于 safe-bin 可执行文件路径的显式额外可信目录。
- `tools.exec.safeBinProfiles`：用于自定义 safe bins 的显式 argv 策略。
- 允许列表：对可执行文件路径的显式信任。

不要把 `safeBins` 当作通用允许列表，也不要添加解释器/运行时二进制文件（例如 `python3`、`node`、`ruby`、`bash`）。如果你需要这些，请使用显式允许列表条目，并保持审批提示启用。
当解释器/运行时 `safeBins` 条目缺少显式配置文件时，`openclaw security audit` 会发出警告，并且 `openclaw doctor --fix` 可以脚手架化缺失的自定义 `safeBinProfiles` 条目。
当你显式将 `jq` 等宽行为 bin 加回 `safeBins` 时，`openclaw security audit` 和 `openclaw doctor` 也会发出警告。
如果你显式允许列表化解释器，请启用 `tools.exec.strictInlineEval`，这样内联代码求值形式仍然需要新的审批。

有关完整策略详情和示例，请参阅 [Exec 审批](/zh-CN/tools/exec-approvals-advanced#safe-bins-stdin-only) 和 [Safe bins 与允许列表](/zh-CN/tools/exec-approvals-advanced#safe-bins-versus-allowlist)。

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

轮询用于按需获取状态，而不是等待循环。如果启用了自动完成唤醒，命令在输出内容或失败时可以唤醒会话。

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

粘贴（默认使用括号粘贴）：

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` 是 `exec` 的子工具，用于结构化多文件编辑。
默认情况下，它对 OpenAI 和 OpenAI Codex 模型启用。仅在你想禁用它或将其限制到特定模型时使用配置：

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

注意事项：

- 仅适用于 OpenAI/OpenAI Codex 模型。
- 工具策略仍然适用；`allow: ["write"]` 会隐式允许 `apply_patch`。
- `deny: ["write"]` 不会拒绝 `apply_patch`；请显式拒绝 `apply_patch`，或在补丁写入也应被阻止时使用 `deny: ["group:fs"]`。
- 配置位于 `tools.exec.applyPatch` 下。
- `tools.exec.applyPatch.enabled` 默认为 `true`；将其设为 `false` 可为 OpenAI 模型禁用该工具。
- `tools.exec.applyPatch.workspaceOnly` 默认为 `true`（限制在工作区内）。只有在你有意让 `apply_patch` 写入/删除工作区目录之外的内容时，才将其设为 `false`。

## 相关内容

- [Exec 审批](/zh-CN/tools/exec-approvals) — shell 命令的审批门禁
- [沙箱隔离](/zh-CN/gateway/sandboxing) — 在沙箱隔离环境中运行命令
- [后台进程](/zh-CN/gateway/background-process) — 长时间运行的 exec 和 process 工具
- [安全](/zh-CN/gateway/security) — 工具策略和提升访问权限
