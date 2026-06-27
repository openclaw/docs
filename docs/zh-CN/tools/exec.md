---
read_when:
    - 使用或修改 Exec 工具
    - 调试 stdin 或 TTY 行为
summary: Exec 工具用法、stdin 模式和 TTY 支持
title: Exec 工具
x-i18n:
    generated_at: "2026-06-27T03:27:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2831d9e66b25ce251f90e59a41b25234e22106d865466e61b878e3999e849dc
    source_path: tools/exec.md
    workflow: 16
---

在工作区中运行 shell 命令。`exec` 是一个会变更状态的 shell 表面：只要所选主机或沙箱文件系统允许，命令就可以在任何位置创建、编辑或删除文件。禁用 OpenClaw 文件系统工具（例如 `write`、`edit` 或 `apply_patch`）并不会让 `exec` 变成只读。

通过 `process` 支持前台 + 后台执行。如果不允许使用 `process`，`exec` 会同步运行并忽略 `yieldMs`/`background`。
后台会话按每个智能体划分范围；`process` 只能看到来自同一智能体的会话。

## 参数

<ParamField path="command" type="string" required>
要运行的 shell 命令。
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
命令的工作目录。
</ParamField>

<ParamField path="env" type="object">
叠加合并到继承环境上的键/值环境覆盖。
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
在此延迟（毫秒）后自动将命令转入后台。
</ParamField>

<ParamField path="background" type="boolean" default="false">
立即将命令转入后台，而不是等待 `yieldMs`。
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
覆盖此调用配置的 exec 超时时间。仅当命令应在没有 exec 进程超时的情况下运行时，才设置 `timeout: 0`。
</ParamField>

<ParamField path="pty" type="boolean" default="false">
可用时在伪终端中运行。用于仅支持 TTY 的 CLI、编码智能体和终端 UI。
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
执行位置。当沙箱运行时处于活动状态时，`auto` 解析为 `sandbox`，否则解析为 `gateway`。
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
普通工具调用会忽略此项。`gateway` / `node` 安全性由
`tools.exec.security` 和主机审批文件控制；提升权限模式只有在操作员明确授予提升权限访问时
才能强制 `security=full`。
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
基线询问模式来自 `tools.exec.ask` 和主机审批。
对于来自渠道的模型调用，当有效主机询问为 `off` 时，会忽略每次调用的 `ask`；
否则它只能强化为更严格的模式。使用显式 `ask` 值构造 exec 工具的
受信任内部/API 调用方不受影响。
</ParamField>

<ParamField path="node" type="string">
当 `host=node` 时使用的节点 id/名称。
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
请求提升权限模式——跳出沙箱进入配置的主机路径。只有当 elevated 解析为 `full` 时才强制 `security=full`。
</ParamField>

说明：

- `host` 默认为 `auto`：当会话的沙箱运行时处于活动状态时为沙箱，否则为 Gateway 网关。
- `host` 只接受 `auto`、`sandbox`、`gateway` 或 `node`。它不是主机名选择器；类似主机名的值会在命令运行前被拒绝。
- `auto` 是默认路由策略，不是通配符。允许从 `auto` 按调用指定 `host=node`；仅当没有活动沙箱运行时时，才允许按调用指定 `host=gateway`。
- `tools.exec.mode` 是标准化的策略旋钮。值为 `deny`、`allowlist`、`ask`、`auto` 和 `full`。`auto` 会直接运行确定性的允许列表/安全二进制匹配，并将所有其余 exec 审批场景通过 OpenClaw 的原生自动审查器路由，然后再询问人类。`ask` / `ask=always` 仍然每次都询问人类。
- 没有额外配置时，`host=auto` 仍然“直接可用”：没有沙箱意味着它解析为 `gateway`；有活动沙箱则保持在沙箱中。
- `elevated` 会跳出沙箱进入配置的主机路径：默认为 `gateway`，或当 `tools.exec.host=node`（或会话默认值为 `host=node`）时为 `node`。它仅在当前会话/提供商启用提升权限访问时可用。
- `gateway`/`node` 审批由主机审批文件控制。
- `node` 需要已配对的节点（配套应用或无头节点主机）。
- 如果有多个节点可用，请设置 `exec.node` 或 `tools.exec.node` 来选择一个。
- `exec host=node` 是节点唯一的 shell 执行路径；旧版 `nodes.run` 包装器已移除。
- `timeout` 适用于前台、后台、`yieldMs`、Gateway 网关、沙箱和节点 `system.run` 执行。如果省略，OpenClaw 使用 `tools.exec.timeoutSec`；显式 `timeout: 0` 会为该调用禁用 exec 进程超时。
- 在非 Windows 主机上，exec 会在设置了 `SHELL` 时使用它；如果 `SHELL` 是 `fish`，则优先从 `PATH` 使用 `bash`（或 `sh`）
  以避免与 fish 不兼容的脚本，然后在两者都不存在时回退到 `SHELL`。
- 在 Windows 主机上，exec 优先发现 PowerShell 7 (`pwsh`)（Program Files、ProgramW6432，然后是 PATH），
  然后回退到 Windows PowerShell 5.1。
- 在非 Windows Gateway 网关主机上，bash 和 zsh exec 命令使用启动快照。OpenClaw 会从 shell 启动文件中捕获可 source 的
  别名/函数和一小组安全环境到
  `$OPENCLAW_STATE_DIR/cache/shell-snapshots/`，然后在每个 exec 命令前 source 该快照。
  类似秘密的变量会被排除；沙箱和节点 exec 不使用此快照。可在 Gateway 网关进程环境中设置
  `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` 来禁用此快照路径。
- 主机执行（`gateway`/`node`）会拒绝 `env.PATH` 和加载器覆盖（`LD_*`/`DYLD_*`），以
  防止二进制劫持或注入代码。
- OpenClaw 会在派生命令环境中（包括 PTY 和沙箱执行）设置 `OPENCLAW_SHELL=exec`，以便 shell/profile 规则可以检测 exec 工具上下文。
- 对于来自渠道的运行，当渠道提供这些 id 时，OpenClaw 还会在
  `OPENCLAW_CHANNEL_CONTEXT` 中暴露一个范围很窄的发送者/聊天身份 JSON 负载。
- `openclaw channels login` 在 `exec` 中被阻止，因为它是交互式渠道认证流程；请在 Gateway 网关主机的终端中运行它，或在聊天中使用渠道原生登录工具（如果存在）。
- 重要：沙箱隔离**默认关闭**。如果沙箱隔离关闭，隐式 `host=auto`
  会解析为 `gateway`。显式 `host=sandbox` 仍会失败关闭，而不是静默地
  在 Gateway 网关主机上运行。请启用沙箱隔离，或使用带审批的 `host=gateway`。
- 脚本预检检查（针对常见 Python/Node shell 语法错误）只检查有效
  `workdir` 边界内的文件。如果脚本路径解析到 `workdir` 外部，则会跳过该文件的预检。
- 对于现在开始的长时间运行工作，请启动一次，并在启用自动
  完成唤醒且命令产生输出或失败时依赖它。
  使用 `process` 查看日志、状态、输入或干预；不要用
  sleep 循环、timeout 循环或重复轮询来模拟调度。
- 对于应稍后或按计划发生的工作，请使用 cron，而不是
  `exec` sleep/delay 模式。

## 配置

- `tools.exec.notifyOnExit`（默认值：true）：为 true 时，转入后台的 exec 会话会在退出时将系统事件入队并请求 Heartbeat。
- `tools.exec.approvalRunningNoticeMs`（默认值：10000）：当需要审批的 exec 运行时间超过此值时，发出一次“正在运行”通知（0 表示禁用）。
- `tools.exec.timeoutSec`（默认值：1800）：每个命令的默认 exec 超时时间，单位为秒。按调用的 `timeout` 会覆盖它；按调用的 `timeout: 0` 会禁用 exec 进程超时。
- `tools.exec.host`（默认值：`auto`；当沙箱运行时处于活动状态时解析为 `sandbox`，否则为 `gateway`）
- `tools.exec.security`（默认值：沙箱为 `deny`，未设置时 Gateway 网关 + 节点为 `full`）
- `tools.exec.ask`（默认值：`off`）
- Gateway 网关 + 节点默认使用无需审批的主机 exec。如果你需要审批/允许列表行为，请同时收紧 `tools.exec.*` 和主机审批文件；参见 [Exec 审批](/zh-CN/tools/exec-approvals#yolo-mode-no-approval)。
- YOLO 来自主机策略默认值（`security=full`、`ask=off`），不是来自 `host=auto`。如果你想强制 Gateway 网关或节点路由，请设置 `tools.exec.host` 或使用 `/exec host=...`。
- 在 `security=full` 加 `ask=off` 模式下，主机 exec 会直接遵循配置的策略；没有额外的启发式命令混淆预过滤器或脚本预检拒绝层。
- `tools.exec.node`（默认值：未设置）
- `tools.exec.strictInlineEval`（默认值：false）：为 true 时，内联解释器 eval 形式（例如 `python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e` 和 `osascript -e`）需要审查器或显式审批。在 `mode=auto` 中，普通 exec 审批路径可能让原生自动审查器允许一个明确低风险的一次性命令；直接的节点主机 `system.run` 调用仍需要显式审批，因为它们无法将命令交给人类审批路径。如果审查器要求，请求会转给人类。`allow-always` 仍可持久化良性的解释器/脚本调用，但内联 eval 形式不会变成持久允许规则。
- `tools.exec.commandHighlighting`（默认值：false）：为 true 时，审批提示可以在命令文本中高亮解析器派生的命令片段。全局或按智能体设置为 `true`，即可在不更改 exec 审批策略的情况下启用命令文本高亮。
- `tools.exec.pathPrepend`：要为 exec 运行前置到 `PATH` 的目录列表（仅 Gateway 网关 + 沙箱）。
- `tools.exec.safeBins`：只使用 stdin 的安全二进制文件，可以在没有显式允许列表条目的情况下运行。有关行为详情，请参见 [Safe bins](/zh-CN/tools/exec-approvals-advanced#safe-bins-stdin-only)。
- `tools.exec.safeBinTrustedDirs`：用于 `safeBins` 路径检查的其他显式受信任目录。`PATH` 条目绝不会被自动信任。内置默认值为 `/bin` 和 `/usr/bin`。
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
  拒绝 `env.PATH` 覆盖。守护进程本身仍使用最小 `PATH`：
  - macOS：`/opt/homebrew/bin`、`/usr/local/bin`、`/usr/bin`、`/bin`
  - Linux：`/usr/local/bin`、`/usr/bin`、`/bin`
    - 为了防止用户 shell 配置（例如 `~/.zshenv` 或 `/etc/zshenv`）在启动期间覆盖优先路径，`tools.exec.pathPrepend` 条目会在即将执行前安全地前置到 shell 命令内部的最终 `PATH`。
- `host=sandbox`：在容器内运行 `sh -lc`（登录 shell），因此 `/etc/profile` 可能会重置 `PATH`。
  OpenClaw 会通过内部环境变量（无 shell 插值）在 profile source 后前置 `env.PATH`；
  `tools.exec.pathPrepend` 也适用于此处。
- `host=node`：只会将你传入的未被阻止的环境覆盖发送到节点。主机执行会
  拒绝 `env.PATH` 覆盖，且节点主机会忽略它。如果你需要在节点上添加额外 PATH 条目，
  请配置节点主机服务环境（systemd/launchd）或将工具安装在标准位置。

按智能体绑定节点（使用配置中的智能体列表索引）：

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Control UI：Nodes 选项卡包含一个小型“Exec 节点绑定”面板，用于相同设置。

## 会话覆盖（`/exec`）

使用 `/exec` 设置 `host`、`security`、`ask` 和 `node` 的**每会话**默认值。
发送不带参数的 `/exec` 可显示当前值。

示例：

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## 授权模型

`/exec` 只会对**已授权发送者**生效（渠道允许列表/配对加上 `commands.useAccessGroups`）。
它只更新**会话状态**，不会写入配置。已授权的外部渠道发送者可以
设置这些会话默认值。内部 Gateway 网关/webchat 客户端需要 `operator.admin` 才能持久化它们。
若要硬禁用 exec，请通过工具策略拒绝它（`tools.deny: ["exec"]` 或按智能体配置）。主机审批
仍会生效，除非你明确设置 `security=full` 和 `ask=off`。

## Exec 审批（配套应用 / 节点主机）

沙箱隔离的智能体在 Gateway 网关或节点主机上运行 `exec` 之前，可能需要逐请求审批。
有关策略、允许列表和 UI 流程，请参阅 [Exec 审批](/zh-CN/tools/exec-approvals)。

需要审批时，exec 工具会立即返回
`status: "approval-pending"` 和一个审批 ID。审批通过后（或被拒绝 / 超时后），
Gateway 网关只会为已批准的运行发出命令进度和完成系统事件
（`Exec running` / `Exec finished`）。被拒绝或超时的审批是终止状态，不会
用拒绝系统事件唤醒智能体会话。
在支持原生审批卡片/按钮的渠道上，智能体应优先依赖该
原生 UI，并且只有当工具结果明确表示聊天审批不可用，或手动审批是
唯一路径时，才包含手动 `/approve` 命令。

## 允许列表 + 安全二进制文件

手动允许列表强制执行会匹配解析后的二进制路径 glob 和裸命令名
glob。裸名称只匹配通过 PATH 调用的命令，因此当命令是 `rg` 时，`rg` 可以匹配
`/opt/homebrew/bin/rg`，但不匹配 `./rg` 或 `/tmp/rg`。
当 `security=allowlist` 时，只有当每个管道
段都在允许列表中或是安全二进制文件时，shell 命令才会被自动允许。链式命令（`;`、`&&`、`||`）和重定向
会在允许列表模式下被拒绝，除非每个顶层段都满足
允许列表（包括安全二进制文件）。重定向仍不受支持。
持久的 `allow-always` 信任不会绕过该规则：链式命令仍要求每个
顶层段都匹配。

`autoAllowSkills` 是 exec 审批中的一条独立便利路径。它不同于
手动路径允许列表条目。若要严格显式信任，请保持禁用 `autoAllowSkills`。

将这两类控制用于不同用途：

- `tools.exec.safeBins`：小型、仅标准输入的流过滤器。
- `tools.exec.safeBinTrustedDirs`：用于安全二进制可执行文件路径的显式额外受信任目录。
- `tools.exec.safeBinProfiles`：用于自定义安全二进制文件的显式 argv 策略。
- 允许列表：对可执行文件路径的显式信任。

不要把 `safeBins` 当作通用允许列表，也不要添加解释器/运行时二进制文件（例如 `python3`、`node`、`ruby`、`bash`）。如果你需要这些，请使用显式允许列表条目，并保持启用审批提示。
当解释器/运行时 `safeBins` 条目缺少显式配置文件时，`openclaw security audit` 会发出警告，并且 `openclaw doctor --fix` 可以搭建缺失的自定义 `safeBinProfiles` 条目。
当你明确把 `jq` 这类宽行为二进制文件加回 `safeBins` 时，`openclaw security audit` 和 `openclaw doctor` 也会发出警告。
如果你明确允许列出解释器，请启用 `tools.exec.strictInlineEval`，这样内联代码求值形式仍需要审查者或显式审批。

有关完整策略详情和示例，请参阅 [Exec 审批](/zh-CN/tools/exec-approvals-advanced#safe-bins-stdin-only) 和 [安全二进制文件与允许列表](/zh-CN/tools/exec-approvals-advanced#safe-bins-versus-allowlist)。

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

轮询用于按需状态查询，而不是等待循环。如果启用了自动完成唤醒，
命令在发出输出或失败时可以唤醒会话。

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
它默认对 OpenAI 和 OpenAI Codex 模型启用。仅在你想
禁用它或将它限制到特定模型时使用配置：

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
- `deny: ["write"]` 不会拒绝 `apply_patch`；请显式拒绝 `apply_patch`，或者在补丁写入也应被阻止时使用 `deny: ["group:fs"]`。
- 配置位于 `tools.exec.applyPatch` 下。
- `tools.exec.applyPatch.enabled` 默认为 `true`；将它设为 `false` 可为 OpenAI 模型禁用该工具。
- `tools.exec.applyPatch.workspaceOnly` 默认为 `true`（限制在工作区内）。仅当你有意让 `apply_patch` 在工作区目录之外写入/删除时，才将它设为 `false`。

## 相关

- [Exec 审批](/zh-CN/tools/exec-approvals) — shell 命令的审批门禁
- [沙箱隔离](/zh-CN/gateway/sandboxing) — 在沙箱隔离环境中运行命令
- [后台进程](/zh-CN/gateway/background-process) — 长时间运行的 exec 和 process 工具
- [安全](/zh-CN/gateway/security) — 工具策略和提升权限访问
