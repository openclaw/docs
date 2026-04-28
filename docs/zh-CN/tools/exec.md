---
read_when:
    - 使用或修改 exec 工具
    - 调试 stdin 或 TTY 行为
summary: Exec 工具用法、stdin 模式和 TTY 支持
title: 执行工具
x-i18n:
    generated_at: "2026-04-28T12:05:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: d951a4e73cc854d767c1084de9054d1c07857599c6f6c5e3f6a00b718b768c51
    source_path: tools/exec.md
    workflow: 16
---

在工作区中运行 shell 命令。通过 `process` 支持前台 + 后台执行。
如果 `process` 被禁用，`exec` 会同步运行，并忽略 `yieldMs`/`background`。
后台会话按智能体划定作用域；`process` 只能看到同一智能体的会话。

## 参数

<ParamField path="command" type="string" required>
要运行的 shell 命令。
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
命令的工作目录。
</ParamField>

<ParamField path="env" type="object">
合并到继承环境之上的键/值环境覆盖项。
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
在此延迟（毫秒）后自动将命令转入后台。
</ParamField>

<ParamField path="background" type="boolean" default="false">
立即将命令转入后台，而不是等待 `yieldMs`。
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
覆盖本次调用配置的 exec 超时时间。仅当命令应在没有 exec 进程超时的情况下运行时，才设置 `timeout: 0`。
</ParamField>

<ParamField path="pty" type="boolean" default="false">
在可用时在伪终端中运行。用于仅支持 TTY 的 CLI、编码智能体和终端 UI。
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
执行位置。`auto` 会在沙箱运行时处于活动状态时解析为 `sandbox`，否则解析为 `gateway`。
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
`gateway` / `node` 执行的强制执行模式。
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
`gateway` / `node` 执行的审批提示行为。
</ParamField>

<ParamField path="node" type="string">
`host=node` 时的节点 id/名称。
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
请求提升模式 — 跳出沙箱并进入配置的主机路径。仅当 elevated 解析为 `full` 时，才会强制使用 `security=full`。
</ParamField>

注意：

- `host` 默认为 `auto`：当会话的沙箱运行时处于活动状态时使用沙箱，否则使用 Gateway 网关。
- `auto` 是默认路由策略，不是通配符。允许从 `auto` 按调用指定 `host=node`；只有在没有沙箱运行时处于活动状态时，才允许按调用指定 `host=gateway`。
- 在没有额外配置的情况下，`host=auto` 仍然“即用即通”：没有沙箱意味着它解析为 `gateway`；有活动沙箱意味着它留在沙箱中。
- `elevated` 会跳出沙箱并进入配置的主机路径：默认是 `gateway`，或者当 `tools.exec.host=node`（或会话默认值为 `host=node`）时是 `node`。它仅在当前会话/提供商启用了提升访问权限时可用。
- `gateway`/`node` 审批由 `~/.openclaw/exec-approvals.json` 控制。
- `node` 需要已配对的节点（配套应用或无头节点主机）。
- 如果有多个可用节点，请设置 `exec.node` 或 `tools.exec.node` 来选择一个。
- `exec host=node` 是节点唯一的 shell 执行路径；旧版 `nodes.run` 包装器已移除。
- `timeout` 适用于前台、后台、`yieldMs`、Gateway 网关、沙箱和节点 `system.run` 执行。如果省略，OpenClaw 会使用 `tools.exec.timeoutSec`；显式的 `timeout: 0` 会为该调用禁用 exec 进程超时。
- 在非 Windows 主机上，exec 会在设置了 `SHELL` 时使用它；如果 `SHELL` 是 `fish`，它会优先使用 `PATH`
  中的 `bash`（或 `sh`）以避免与 fish 不兼容的脚本，然后在两者都不存在时回退到 `SHELL`。
- 在 Windows 主机上，exec 会优先发现 PowerShell 7（`pwsh`）（Program Files、ProgramW6432，然后是 PATH），
  然后回退到 Windows PowerShell 5.1。
- 主机执行（`gateway`/`node`）会拒绝 `env.PATH` 和加载器覆盖项（`LD_*`/`DYLD_*`），以
  防止二进制劫持或代码注入。
- OpenClaw 会在生成的命令环境中设置 `OPENCLAW_SHELL=exec`（包括 PTY 和沙箱执行），这样 shell/profile 规则就能检测 exec 工具上下文。
- `openclaw channels login` 会被 `exec` 阻止，因为它是交互式渠道认证流程；请在 Gateway 网关主机上的终端中运行它，或在存在渠道原生登录工具时从聊天中使用该工具。
- 重要：沙箱隔离**默认关闭**。如果沙箱隔离关闭，隐式 `host=auto`
  会解析为 `gateway`。显式 `host=sandbox` 仍会安全失败，而不是静默
  在 Gateway 网关主机上运行。启用沙箱隔离，或使用带审批的 `host=gateway`。
- 脚本预检检查（针对常见 Python/Node shell 语法错误）只检查有效 `workdir`
  边界内的文件。如果脚本路径解析到 `workdir` 外部，则会跳过该文件的预检。
- 对于现在开始的长时间运行工作，启动一次即可，并在启用自动
  完成唤醒且命令输出内容或失败时依赖它。
  使用 `process` 查看日志、状态、输入或进行干预；不要用 sleep 循环、timeout 循环或重复轮询来模拟
  调度。
- 对于应稍后发生或按计划发生的工作，请使用 cron，而不是
  `exec` sleep/delay 模式。

## 配置

- `tools.exec.notifyOnExit`（默认：true）：为 true 时，后台 exec 会话会在退出时将系统事件加入队列并请求心跳。
- `tools.exec.approvalRunningNoticeMs`（默认：10000）：当需要审批的 exec 运行时间超过此值时，发出一次“正在运行”通知（0 表示禁用）。
- `tools.exec.timeoutSec`（默认：1800）：每条命令的默认 exec 超时时间（秒）。按调用设置的 `timeout` 会覆盖它；按调用设置 `timeout: 0` 会禁用 exec 进程超时。
- `tools.exec.host`（默认：`auto`；当沙箱运行时处于活动状态时解析为 `sandbox`，否则解析为 `gateway`）
- `tools.exec.security`（默认：沙箱为 `deny`，Gateway 网关 + 节点在未设置时为 `full`）
- `tools.exec.ask`（默认：`off`）
- 无审批主机 exec 是 Gateway 网关 + 节点的默认行为。如果你想要审批/允许列表行为，请同时收紧 `tools.exec.*` 和主机 `~/.openclaw/exec-approvals.json`；参见 [Exec 审批](/zh-CN/tools/exec-approvals#no-approval-yolo-mode)。
- YOLO 来自主机策略默认值（`security=full`、`ask=off`），而不是来自 `host=auto`。如果你想强制 Gateway 网关或节点路由，请设置 `tools.exec.host` 或使用 `/exec host=...`。
- 在 `security=full` 加 `ask=off` 模式下，主机 exec 会直接遵循配置的策略；没有额外的启发式命令混淆预过滤器或脚本预检拒绝层。
- `tools.exec.node`（默认：未设置）
- `tools.exec.strictInlineEval`（默认：false）：为 true 时，内联解释器 eval 形式（例如 `python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e` 和 `osascript -e`）始终需要显式审批。`allow-always` 仍可持久化良性解释器/脚本调用，但内联 eval 形式仍会每次提示。
- `tools.exec.pathPrepend`：要为 exec 运行添加到 `PATH` 前面的目录列表（仅 Gateway 网关 + 沙箱）。
- `tools.exec.safeBins`：仅 stdin 的安全二进制文件，无需显式允许列表条目即可运行。有关行为详情，请参见 [安全二进制文件](/zh-CN/tools/exec-approvals-advanced#safe-bins-stdin-only)。
- `tools.exec.safeBinTrustedDirs`：用于 `safeBins` 路径检查的其他显式可信目录。`PATH` 条目永远不会自动受信任。内置默认值为 `/bin` 和 `/usr/bin`。
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

- `host=gateway`：将你的登录 shell `PATH` 合并到 exec 环境中。主机执行会拒绝 `env.PATH` 覆盖项。守护进程本身仍使用最小 `PATH` 运行：
  - macOS：`/opt/homebrew/bin`、`/usr/local/bin`、`/usr/bin`、`/bin`
  - Linux：`/usr/local/bin`、`/usr/bin`、`/bin`
- `host=sandbox`：在容器内运行 `sh -lc`（登录 shell），因此 `/etc/profile` 可能会重置 `PATH`。
  OpenClaw 会在 profile sourcing 后通过内部 env var（无 shell 插值）添加 `env.PATH` 前缀；
  `tools.exec.pathPrepend` 在这里也适用。
- `host=node`：只会把你传入的非阻止 env 覆盖项发送到节点。主机执行会拒绝 `env.PATH` 覆盖项，并且节点主机会忽略它们。如果你需要在节点上增加 PATH 条目，
  请配置节点主机服务环境（systemd/launchd），或将工具安装到标准位置。

按智能体绑定节点（在配置中使用智能体列表索引）：

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

控制 UI：Nodes 选项卡包含一个小型“Exec 节点绑定”面板，用于相同设置。

## 会话覆盖项（`/exec`）

使用 `/exec` 为 `host`、`security`、`ask` 和 `node` 设置**按会话**默认值。
发送不带参数的 `/exec` 可显示当前值。

示例：

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## 授权模型

`/exec` 仅对**已授权发送者**生效（渠道允许列表/配对加 `commands.useAccessGroups`）。
它只更新**会话状态**，不会写入配置。要硬性禁用 exec，请通过工具
策略拒绝它（`tools.deny: ["exec"]` 或按智能体设置）。除非你显式设置
`security=full` 和 `ask=off`，否则主机审批仍会适用。

## Exec 审批（配套应用 / 节点主机）

沙箱隔离的智能体可以要求在 `exec` 于 Gateway 网关或节点主机上运行之前进行逐请求审批。
有关策略、允许列表和 UI 流程，请参见 [Exec 审批](/zh-CN/tools/exec-approvals)。

当需要审批时，exec 工具会立即返回
`status: "approval-pending"` 和审批 id。审批通过（或拒绝 / 超时）后，
Gateway 网关会发出系统事件（`Exec finished` / `Exec denied`）。如果命令在
`tools.exec.approvalRunningNoticeMs` 后仍在运行，会发出一次 `Exec running` 通知。
在具有原生审批卡片/按钮的渠道上，智能体应优先依赖该
原生 UI，并且仅当工具结果明确说明聊天审批不可用或手动审批是唯一
路径时，才包含手动 `/approve` 命令。

## 允许列表 + 安全二进制文件

手动允许列表强制执行会匹配已解析的二进制路径 glob 和裸命令名
glob。裸名称只匹配通过 PATH 调用的命令，因此当命令是 `rg` 时，`rg` 可以匹配
`/opt/homebrew/bin/rg`，但不能匹配 `./rg` 或 `/tmp/rg`。
当 `security=allowlist` 时，只有在每个管道
片段都位于允许列表中或是安全二进制文件时，shell 命令才会自动允许。链式调用（`;`、`&&`、`||`）和重定向
会在允许列表模式下被拒绝，除非每个顶层片段都满足
允许列表（包括安全二进制文件）。仍不支持重定向。
持久的 `allow-always` 信任不会绕过该规则：链式命令仍要求每个
顶层片段都匹配。

`autoAllowSkills` 是 exec 审批中的一个单独便利路径。它不同于
手动路径允许列表条目。对于严格的显式信任，请保持 `autoAllowSkills` 禁用。

将这两类控制用于不同任务：

- `tools.exec.safeBins`：小型、仅 stdin 的流过滤器。
- `tools.exec.safeBinTrustedDirs`：用于安全二进制文件可执行路径的显式额外可信目录。
- `tools.exec.safeBinProfiles`：用于自定义安全二进制文件的显式 argv 策略。
- allowlist：对可执行路径的显式信任。

不要把 `safeBins` 当作通用允许列表，也不要添加解释器/运行时二进制文件（例如 `python3`、`node`、`ruby`、`bash`）。如果你需要这些，请使用显式允许列表条目，并保持启用审批提示。
当解释器/运行时 `safeBins` 条目缺少显式配置档案时，`openclaw security audit` 会发出警告，并且 `openclaw doctor --fix` 可以搭建缺失的自定义 `safeBinProfiles` 条目。
当你显式地把 `jq` 等行为范围较广的二进制文件重新添加到 `safeBins` 时，`openclaw security audit` 和 `openclaw doctor` 也会发出警告。
如果你显式允许列入解释器，请启用 `tools.exec.strictInlineEval`，这样内联代码求值形式仍然需要新的审批。

完整策略细节和示例请参阅 [Exec 审批](/zh-CN/tools/exec-approvals-advanced#safe-bins-stdin-only) 和 [安全二进制文件与允许列表](/zh-CN/tools/exec-approvals-advanced#safe-bins-versus-allowlist)。

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

轮询用于按需查看 Status，而不是等待循环。如果启用了自动完成唤醒，当命令产生输出或失败时，它可以唤醒会话。

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

粘贴（默认带括号粘贴）：

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` 是 `exec` 的子工具，用于结构化的多文件编辑。
它默认对 OpenAI 和 OpenAI Codex 模型启用。仅当你想禁用它，或将其限制为特定模型时，才使用配置：

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
- `tools.exec.applyPatch.enabled` 默认为 `true`；将其设置为 `false` 可为 OpenAI 模型禁用该工具。
- `tools.exec.applyPatch.workspaceOnly` 默认为 `true`（限制在工作区内）。只有在你有意让 `apply_patch` 写入/删除工作区目录之外的内容时，才将其设置为 `false`。

## 相关内容

- [Exec 审批](/zh-CN/tools/exec-approvals) — shell 命令的审批门禁
- [沙箱隔离](/zh-CN/gateway/sandboxing) — 在沙箱隔离环境中运行命令
- [后台进程](/zh-CN/gateway/background-process) — 长时间运行的 exec 和 process 工具
- [安全](/zh-CN/gateway/security) — 工具策略和提升访问权限
