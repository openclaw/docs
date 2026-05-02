---
read_when:
    - 使用或修改 exec 工具
    - 调试 stdin 或 TTY 行为
summary: Exec 工具用法、stdin 模式和 TTY 支持
title: 执行工具
x-i18n:
    generated_at: "2026-05-02T20:51:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67d2847f70142b326f527a79ffddab1015b897e8ec4d7ce4557430e57fe0956a
    source_path: tools/exec.md
    workflow: 16
---

在工作区中运行 shell 命令。支持通过 `process` 进行前台 + 后台执行。
如果 `process` 被禁用，`exec` 会同步运行并忽略 `yieldMs`/`background`。
后台会话按智能体限定作用域；`process` 只能看到同一智能体的会话。

## 参数

<ParamField path="command" type="string" required>
要运行的 shell 命令。
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
命令的工作目录。
</ParamField>

<ParamField path="env" type="object">
叠加到继承环境之上的键/值环境覆盖项。
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
执行位置。`auto` 在沙箱运行时处于活动状态时解析为 `sandbox`，否则解析为 `gateway`。
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
`gateway` / `node` 执行的强制执行模式。
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
`gateway` / `node` 执行的批准提示行为。
</ParamField>

<ParamField path="node" type="string">
当 `host=node` 时的节点 ID/名称。
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
请求提升模式 —— 逃逸沙箱并进入配置的主机路径。仅当提升解析为 `full` 时，才会强制使用 `security=full`。
</ParamField>

注意：

- `host` 默认值为 `auto`：当会话的沙箱运行时处于活动状态时使用沙箱，否则使用 Gateway 网关。
- `host` 只接受 `auto`、`sandbox`、`gateway` 或 `node`。它不是主机名选择器；类似主机名的值会在命令运行前被拒绝。
- `auto` 是默认路由策略，不是通配符。允许从 `auto` 逐次调用设置 `host=node`；仅当没有活动的沙箱运行时时，才允许逐次调用设置 `host=gateway`。
- 即使没有额外配置，`host=auto` 仍然“直接可用”：没有沙箱时它解析为 `gateway`；存在实时沙箱时它会留在沙箱中。
- `elevated` 会逃逸沙箱并进入配置的主机路径：默认是 `gateway`，或在 `tools.exec.host=node`（或会话默认值为 `host=node`）时为 `node`。仅当当前会话/提供商启用提升访问时才可用。
- `gateway`/`node` 批准由 `~/.openclaw/exec-approvals.json` 控制。
- `node` 需要已配对的节点（配套应用或无头节点主机）。
- 如果有多个节点可用，请设置 `exec.node` 或 `tools.exec.node` 来选择一个。
- `exec host=node` 是节点的唯一 shell 执行路径；旧版 `nodes.run` 包装器已被移除。
- `timeout` 适用于前台、后台、`yieldMs`、Gateway 网关、沙箱和节点 `system.run` 执行。如果省略，OpenClaw 会使用 `tools.exec.timeoutSec`；显式 `timeout: 0` 会禁用该调用的 exec 进程超时。
- 在非 Windows 主机上，exec 会在已设置时使用 `SHELL`；如果 `SHELL` 是 `fish`，它会优先从 `PATH` 使用 `bash`（或 `sh`）
  以避免与 fish 不兼容的脚本，然后在两者都不存在时回退到 `SHELL`。
- 在 Windows 主机上，exec 会优先发现 PowerShell 7（`pwsh`）（Program Files、ProgramW6432，然后是 PATH），
  然后回退到 Windows PowerShell 5.1。
- 主机执行（`gateway`/`node`）会拒绝 `env.PATH` 和加载器覆盖项（`LD_*`/`DYLD_*`），以
  防止二进制劫持或注入代码。
- OpenClaw 会在生成的命令环境中（包括 PTY 和沙箱执行）设置 `OPENCLAW_SHELL=exec`，以便 shell/profile 规则能检测 exec 工具上下文。
- `openclaw channels login` 会被 `exec` 阻止，因为它是交互式渠道认证流程；请在 Gateway 网关主机上的终端中运行它，或在存在渠道原生登录工具时从聊天中使用该工具。
- 重要：沙箱隔离**默认关闭**。如果沙箱隔离关闭，隐式 `host=auto`
  会解析为 `gateway`。显式 `host=sandbox` 仍会以关闭方式失败，而不是静默地
  在 Gateway 网关主机上运行。请启用沙箱隔离，或使用带批准的 `host=gateway`。
- 脚本预检检查（用于常见 Python/Node shell 语法错误）只检查有效 `workdir` 边界内的文件。如果脚本路径解析到 `workdir` 之外，则会跳过该文件的预检。
- 对于现在开始的长时间运行工作，启动一次即可，并在启用时依赖自动
  完成唤醒，前提是命令有输出或失败。
  使用 `process` 查看日志、Status、输入或干预；不要用
  sleep 循环、timeout 循环或重复轮询来模拟调度。
- 对于应在稍后或按计划发生的工作，请使用 cron，而不是
  `exec` sleep/delay 模式。

## 配置

- `tools.exec.notifyOnExit`（默认值：true）：为 true 时，后台化的 exec 会话会在退出时排入系统事件并请求 Heartbeat。
- `tools.exec.approvalRunningNoticeMs`（默认值：10000）：当受批准门控的 exec 运行时间超过此值时，发出一次“正在运行”通知（0 表示禁用）。
- `tools.exec.timeoutSec`（默认值：1800）：每个命令的默认 exec 超时时间（秒）。逐次调用的 `timeout` 会覆盖它；逐次调用的 `timeout: 0` 会禁用 exec 进程超时。
- `tools.exec.host`（默认值：`auto`；当沙箱运行时处于活动状态时解析为 `sandbox`，否则解析为 `gateway`）
- `tools.exec.security`（默认值：沙箱为 `deny`，Gateway 网关 + 节点未设置时为 `full`）
- `tools.exec.ask`（默认值：`off`）
- 免批准主机 exec 是 Gateway 网关 + 节点的默认行为。如果你需要批准/允许列表行为，请同时收紧 `tools.exec.*` 和主机 `~/.openclaw/exec-approvals.json`；参见 [Exec 批准](/zh-CN/tools/exec-approvals#yolo-mode-no-approval)。
- YOLO 来自主机策略默认值（`security=full`、`ask=off`），而不是来自 `host=auto`。如果你想强制 Gateway 网关或节点路由，请设置 `tools.exec.host` 或使用 `/exec host=...`。
- 在 `security=full` 加 `ask=off` 模式下，主机 exec 会直接遵循配置的策略；没有额外的启发式命令混淆预过滤器或脚本预检拒绝层。
- `tools.exec.node`（默认值：未设置）
- `tools.exec.strictInlineEval`（默认值：false）：为 true 时，内联解释器 eval 形式（如 `python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e` 和 `osascript -e`）始终需要显式批准。`allow-always` 仍可持久保存良性的解释器/脚本调用，但内联 eval 形式每次仍会提示。
- `tools.exec.pathPrepend`：为 exec 运行预置到 `PATH` 的目录列表（仅 Gateway 网关 + 沙箱）。
- `tools.exec.safeBins`：只读取 stdin 的安全二进制文件，无需显式允许列表条目即可运行。有关行为详情，请参见 [安全二进制文件](/zh-CN/tools/exec-approvals-advanced#safe-bins-stdin-only)。
- `tools.exec.safeBinTrustedDirs`：额外的显式可信目录，用于 `safeBins` 路径检查。`PATH` 条目永远不会被自动信任。内置默认值为 `/bin` 和 `/usr/bin`。
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

- `host=gateway`：将你的登录 shell `PATH` 合并到 exec 环境中。主机执行会拒绝 `env.PATH` 覆盖项。守护进程本身仍使用最小化 `PATH`：
  - macOS：`/opt/homebrew/bin`、`/usr/local/bin`、`/usr/bin`、`/bin`
  - Linux：`/usr/local/bin`、`/usr/bin`、`/bin`
- `host=sandbox`：在容器内运行 `sh -lc`（登录 shell），因此 `/etc/profile` 可能会重置 `PATH`。
  OpenClaw 会在 profile sourcing 后通过内部环境变量预置 `env.PATH`（无 shell 插值）；
  `tools.exec.pathPrepend` 也适用于这里。
- `host=node`：只有你传入的未被阻止的 env 覆盖项会发送到节点。主机执行会拒绝 `env.PATH` 覆盖项，并且节点主机会忽略它们。如果你需要在节点上添加额外 PATH 条目，请配置节点主机服务环境（systemd/launchd），或将工具安装到标准位置。

按智能体绑定节点（在配置中使用智能体列表索引）：

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

控制 UI：Nodes 选项卡包含一个小型“Exec 节点绑定”面板，用于相同设置。

## 会话覆盖（`/exec`）

使用 `/exec` 为 `host`、`security`、`ask` 和 `node` 设置**按会话**的默认值。
发送不带参数的 `/exec` 可显示当前值。

示例：

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## 授权模型

`/exec` 只会对**已授权发送者**生效（渠道允许列表/配对加 `commands.useAccessGroups`）。
它只更新**会话状态**，不会写入配置。要强制禁用 exec，请通过工具
策略（`tools.deny: ["exec"]` 或按智能体）拒绝它。除非你显式设置
`security=full` 和 `ask=off`，否则主机批准仍会生效。

## Exec 批准（配套应用 / 节点主机）

沙箱隔离的智能体在 `exec` 于 Gateway 网关或节点主机上运行前，可以要求按请求批准。
有关策略、允许列表和 UI 流程，请参见 [Exec 批准](/zh-CN/tools/exec-approvals)。

需要批准时，exec 工具会立即返回
`status: "approval-pending"` 和批准 ID。批准（或拒绝/超时）后，
Gateway 网关会发出系统事件（`Exec finished` / `Exec denied`）。如果命令在
`tools.exec.approvalRunningNoticeMs` 后仍在运行，会发出一次 `Exec running` 通知。
在具有原生批准卡片/按钮的渠道上，智能体应优先依赖该
原生 UI，并且仅当工具结果明确表示聊天批准不可用，或手动批准是
唯一路径时，才包含手动 `/approve` 命令。

## 允许列表 + 安全二进制文件

手动允许列表强制执行会匹配解析后的二进制路径 glob 和裸命令名
glob。裸名称仅匹配通过 PATH 调用的命令，因此当命令为 `rg` 时，`rg` 可以匹配
`/opt/homebrew/bin/rg`，但不能匹配 `./rg` 或 `/tmp/rg`。
当 `security=allowlist` 时，只有每个 pipeline
片段都在允许列表中或是安全二进制文件时，shell 命令才会被自动允许。链式命令（`;`、`&&`、`||`）和重定向
在允许列表模式下会被拒绝，除非每个顶层片段都满足
允许列表（包括安全二进制文件）。重定向仍不受支持。
持久 `allow-always` 信任不会绕过该规则：链式命令仍要求每个
顶层片段都匹配。

`autoAllowSkills` 是 exec 批准中的独立便利路径。它不同于
手动路径允许列表条目。对于严格的显式信任，请保持 `autoAllowSkills` 禁用。

将这两个控件用于不同任务：

- `tools.exec.safeBins`：小型、只读取 stdin 的流过滤器。
- `tools.exec.safeBinTrustedDirs`：用于安全二进制文件可执行路径的显式额外可信目录。
- `tools.exec.safeBinProfiles`：自定义安全二进制文件的显式 argv 策略。
- allowlist：对可执行路径的显式信任。

不要将 `safeBins` 视为通用允许列表，也不要添加解释器/运行时二进制文件（例如 `python3`、`node`、`ruby`、`bash`）。如果你需要这些，请使用显式允许列表条目，并保持启用批准提示。
当解释器/运行时 `safeBins` 条目缺少显式配置文件时，`openclaw security audit` 会发出警告，并且 `openclaw doctor --fix` 可以搭建缺失的自定义 `safeBinProfiles` 条目。
当你显式将 `jq` 等宽泛行为的二进制文件加回 `safeBins` 时，`openclaw security audit` 和 `openclaw doctor` 也会发出警告。
如果你显式允许列出解释器，请启用 `tools.exec.strictInlineEval`，使内联代码求值形式仍然需要新的批准。

有关完整策略详情和示例，请参阅 [Exec 批准](/zh-CN/tools/exec-approvals-advanced#safe-bins-stdin-only) 和 [安全二进制文件与允许列表](/zh-CN/tools/exec-approvals-advanced#safe-bins-versus-allowlist)。

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
命令在输出内容或失败时可以唤醒会话。

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
它默认对 OpenAI 和 OpenAI Codex 模型启用。仅当你想禁用它或将其限制到特定模型时才使用配置：

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

注意：

- 仅适用于 OpenAI/OpenAI Codex 模型。
- 工具策略仍然适用；`allow: ["write"]` 会隐式允许 `apply_patch`。
- 配置位于 `tools.exec.applyPatch` 下。
- `tools.exec.applyPatch.enabled` 默认为 `true`；将其设为 `false` 可为 OpenAI 模型禁用该工具。
- `tools.exec.applyPatch.workspaceOnly` 默认为 `true`（限制在工作区内）。只有当你有意希望 `apply_patch` 在工作区目录外写入/删除时，才将其设为 `false`。

## 相关内容

- [Exec 批准](/zh-CN/tools/exec-approvals) — shell 命令的批准门禁
- [沙箱隔离](/zh-CN/gateway/sandboxing) — 在沙箱隔离环境中运行命令
- [后台进程](/zh-CN/gateway/background-process) — 长时间运行的 exec 和 process 工具
- [安全](/zh-CN/gateway/security) — 工具策略和提升访问权限
