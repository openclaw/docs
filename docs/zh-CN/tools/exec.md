---
read_when:
    - 使用或修改 Exec 工具
    - 调试 stdin 或 TTY 行为
summary: Exec 工具用法、stdin 模式和 TTY 支持
title: Exec 工具
x-i18n:
    generated_at: "2026-04-25T03:25:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 358f9155120382fa2b03b22e22408bdb9e51715f80c8b1701a1ff7fd05850188
    source_path: tools/exec.md
    workflow: 15
---

在工作区中运行 shell 命令。通过 `process` 支持前台 + 后台执行。
如果 `process` 被禁用，`exec` 会同步运行，并忽略 `yieldMs`/`background`。
后台会话按智能体隔离；`process` 只能看到同一智能体的会话。

## 参数

<ParamField path="command" type="string" required>
要运行的 shell 命令。
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
命令的工作目录。
</ParamField>

<ParamField path="env" type="object">
在继承环境之上合并的键 / 值环境变量覆盖。
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
在此延迟（毫秒）后自动将命令转入后台。
</ParamField>

<ParamField path="background" type="boolean" default="false">
立即将命令转入后台，而不是等待 `yieldMs`。
</ParamField>

<ParamField path="timeout" type="number" default="1800">
在这么多秒后终止命令。
</ParamField>

<ParamField path="pty" type="boolean" default="false">
在可用时于伪终端中运行。用于仅支持 TTY 的 CLI、编码智能体和终端 UI。
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
执行位置。启用了沙箱运行时时，`auto` 解析为 `sandbox`，否则解析为 `gateway`。
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
用于 `gateway` / `node` 执行的强制模式。
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
用于 `gateway` / `node` 执行的批准提示行为。
</ParamField>

<ParamField path="node" type="string">
当 `host=node` 时的节点 id / 名称。
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
请求提升模式——从沙箱逃逸到已配置的宿主路径。仅当 elevated 解析为 `full` 时，才会强制 `security=full`。
</ParamField>

说明：

- `host` 默认为 `auto`：如果当前会话启用了沙箱运行时，则为 `sandbox`，否则为 `gateway`。
- `auto` 是默认路由策略，不是通配符。允许在单次调用中使用 `host=node`；仅当未启用沙箱运行时时，才允许在单次调用中使用 `host=gateway`。
- 在没有额外配置时，`host=auto` 仍然可以“直接工作”：没有沙箱时，它会解析为 `gateway`；有活动沙箱时，它会保留在沙箱中。
- `elevated` 会从沙箱逃逸到已配置的宿主路径：默认是 `gateway`，或者当 `tools.exec.host=node`（或会话默认值为 `host=node`）时为 `node`。只有当前会话 / 提供商启用了提升访问时才可用。
- `gateway`/`node` 批准由 `~/.openclaw/exec-approvals.json` 控制。
- `node` 需要一个已配对的节点（配套应用或无头节点宿主）。
- 如果有多个可用节点，请设置 `exec.node` 或 `tools.exec.node` 进行选择。
- `exec host=node` 是节点唯一的 shell 执行路径；旧版 `nodes.run` 包装器已被移除。
- 在非 Windows 宿主上，如果设置了 `SHELL`，exec 会使用它；如果 `SHELL` 是 `fish`，则会优先从 `PATH` 中选择 `bash`（或 `sh`）以避免与 fish 不兼容的脚本，然后在两者都不存在时回退到 `SHELL`。
- 在 Windows 宿主上，exec 会优先发现 PowerShell 7（`pwsh`）（依次检查 Program Files、ProgramW6432、再到 PATH），然后回退到 Windows PowerShell 5.1。
- 宿主执行（`gateway`/`node`）会拒绝 `env.PATH` 和加载器覆盖（`LD_*`/`DYLD_*`），以防止二进制劫持或注入代码。
- OpenClaw 会在生成的命令环境中设置 `OPENCLAW_SHELL=exec`（包括 PTY 和沙箱执行），这样 shell / profile 规则就能检测到 exec 工具上下文。
- 重要：默认情况下**关闭**沙箱隔离。如果沙箱隔离关闭，隐式 `host=auto` 会解析为 `gateway`。显式 `host=sandbox` 仍会以失败关闭的方式处理，而不是悄悄地在 gateway 宿主上运行。请启用沙箱隔离，或使用带批准的 `host=gateway`。
- 脚本预检（用于常见的 Python/Node shell 语法错误）仅检查有效 `workdir` 边界内的文件。如果脚本路径解析到 `workdir` 之外，则会跳过该文件的预检。
- 对于现在开始的长时间运行工作，只启动一次，并在启用了自动完成唤醒且命令产生输出或失败时依赖自动完成唤醒。
  使用 `process` 处理日志、状态、输入或干预；不要用 sleep 循环、timeout 循环或重复轮询来模拟调度。
- 对于应稍后执行或按计划执行的工作，请使用 cron，而不是
  `exec` 的 sleep / delay 模式。

## 配置

- `tools.exec.notifyOnExit`（默认：true）：为 true 时，转入后台的 exec 会话会在退出时排入一个系统事件并请求一次心跳。
- `tools.exec.approvalRunningNoticeMs`（默认：10000）：当需要批准的 exec 运行时间超过此值时，发出一次“运行中”通知（设为 0 可禁用）。
- `tools.exec.host`（默认：`auto`；启用了沙箱运行时时解析为 `sandbox`，否则为 `gateway`）
- `tools.exec.security`（默认：沙箱为 `deny`，未设置时 gateway + node 为 `full`）
- `tools.exec.ask`（默认：`off`）
- 无需批准的宿主 exec 是 gateway + node 的默认行为。如果你希望使用批准 / allowlist 行为，请同时收紧 `tools.exec.*` 和宿主 `~/.openclaw/exec-approvals.json`；参见 [Exec approvals](/zh-CN/tools/exec-approvals#no-approval-yolo-mode)。
- YOLO 来自宿主策略默认值（`security=full`、`ask=off`），而不是 `host=auto`。如果你想强制使用 gateway 或 node 路由，请设置 `tools.exec.host` 或使用 `/exec host=...`。
- 在 `security=full` 且 `ask=off` 模式下，宿主 exec 会直接遵循已配置策略；不会有额外的启发式命令混淆预过滤层，也不会有脚本预检拒绝层。
- `tools.exec.node`（默认：未设置）
- `tools.exec.strictInlineEval`（默认：false）：为 true 时，内联解释器求值形式，如 `python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e` 和 `osascript -e`，始终需要显式批准。`allow-always` 仍可持久化良性的解释器 / 脚本调用，但内联求值形式每次仍会提示。
- `tools.exec.pathPrepend`：在 exec 运行前追加到 `PATH` 前面的目录列表（仅 gateway + sandbox）。
- `tools.exec.safeBins`：仅 stdin 的安全二进制，可在没有显式 allowlist 条目的情况下运行。有关行为细节，请参见 [Safe bins](/zh-CN/tools/exec-approvals-advanced#safe-bins-stdin-only)。
- `tools.exec.safeBinTrustedDirs`：用于 `safeBins` 路径检查的额外显式可信目录。`PATH` 条目永远不会被自动信任。内置默认值为 `/bin` 和 `/usr/bin`。
- `tools.exec.safeBinProfiles`：可选的每个 safe bin 自定义 argv 策略（`minPositional`、`maxPositional`、`allowedValueFlags`、`deniedFlags`）。

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

- `host=gateway`：将你的登录 shell `PATH` 合并到 exec 环境中。宿主执行会拒绝 `env.PATH` 覆盖。不过守护进程本身仍使用一个最小化的 `PATH`：
  - macOS：`/opt/homebrew/bin`、`/usr/local/bin`、`/usr/bin`、`/bin`
  - Linux：`/usr/local/bin`、`/usr/bin`、`/bin`
- `host=sandbox`：在容器内运行 `sh -lc`（登录 shell），因此 `/etc/profile` 可能会重置 `PATH`。
  OpenClaw 会在 profile source 之后，通过一个内部环境变量（不使用 shell 插值）将 `env.PATH` 追加到前面；
  `tools.exec.pathPrepend` 在这里同样适用。
- `host=node`：只会将你传入的未被阻止的环境变量覆盖发送到节点。宿主执行会拒绝 `env.PATH` 覆盖，节点宿主也会忽略它们。如果你需要在节点上添加额外的 PATH 条目，
  请配置节点宿主服务环境（systemd/launchd），或将工具安装到标准位置。

按智能体绑定节点（在配置中使用智能体列表索引）：

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

控制 UI：Nodes 标签页包含一个小型“Exec node binding”面板，用于配置相同设置。

## 会话覆盖（`/exec`）

使用 `/exec` 设置**按会话**的 `host`、`security`、`ask` 和 `node` 默认值。
发送不带参数的 `/exec` 可显示当前值。

示例：

```text
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## 授权模型

`/exec` 仅对**已授权发送者**生效（渠道 allowlist / 配对，加上 `commands.useAccessGroups`）。
它只会更新**会话状态**，不会写入配置。若要硬禁用 exec，请通过工具
策略拒绝它（`tools.deny: ["exec"]` 或按智能体配置）。
除非你显式设置 `security=full` 且 `ask=off`，否则宿主批准仍然适用。

## Exec approvals（配套应用 / 节点宿主）

沙箱隔离的智能体可以要求在 `exec` 于 gateway 或 node 宿主上运行前逐请求批准。
有关策略、allowlist 和 UI 流程，请参见 [Exec approvals](/zh-CN/tools/exec-approvals)。

当需要批准时，exec 工具会立即返回，
其中包含 `status: "approval-pending"` 和一个 approval id。一旦批准（或拒绝 / 超时），
Gateway 网关会发出系统事件（`Exec finished` / `Exec denied`）。如果命令在
`tools.exec.approvalRunningNoticeMs` 之后仍在运行，则会发出一次 `Exec running` 通知。
在支持原生批准卡片 / 按钮的渠道上，智能体应优先依赖该
原生 UI，仅当工具结果明确指出聊天批准不可用，或手动批准是唯一途径时，才包含手动 `/approve` 命令。

## Allowlist + safe bins

手动 allowlist 强制会匹配已解析二进制路径 glob 和裸命令名
glob。裸名称只匹配通过 PATH 调用的命令，因此当命令是 `rg` 时，`rg` 可以匹配
`/opt/homebrew/bin/rg`，但不能匹配 `./rg` 或 `/tmp/rg`。
当 `security=allowlist` 时，仅当管道中的每个片段都在 allowlist 中或属于 safe bin，shell 命令才会被自动允许。链式命令（`;`、`&&`、`||`）和重定向
在 allowlist 模式下会被拒绝，除非每个顶层片段都满足
allowlist 条件（包括 safe bins）。重定向仍然不受支持。
持久化的 `allow-always` 信任也不会绕过该规则：链式命令仍要求每个
顶层片段都匹配。

`autoAllowSkills` 是 exec approvals 中一个单独的便捷路径。它与
手动路径 allowlist 条目不同。如果你需要严格的显式信任，请保持 `autoAllowSkills` 关闭。

请将这两种控制用于不同用途：

- `tools.exec.safeBins`：小型、仅 stdin 的流过滤二进制。
- `tools.exec.safeBinTrustedDirs`：用于 safe-bin 可执行路径的额外显式可信目录。
- `tools.exec.safeBinProfiles`：用于自定义 safe bins 的显式 argv 策略。
- allowlist：对可执行路径的显式信任。

不要将 `safeBins` 当作通用 allowlist，也不要添加解释器 / 运行时二进制（例如 `python3`、`node`、`ruby`、`bash`）。如果你需要这些，请使用显式 allowlist 条目，并保持批准提示开启。
当解释器 / 运行时 `safeBins` 条目缺少显式 profiles 时，`openclaw security audit` 会发出警告，而 `openclaw doctor --fix` 可以为缺失的自定义 `safeBinProfiles` 条目生成脚手架。
当你显式将诸如 `jq` 之类的广泛行为二进制重新加入 `safeBins` 时，`openclaw security audit` 和 `openclaw doctor` 也会发出警告。
如果你显式将解释器加入 allowlist，请启用 `tools.exec.strictInlineEval`，这样内联代码求值形式仍然需要新的批准。

有关完整的策略细节和示例，请参见 [Exec approvals](/zh-CN/tools/exec-approvals-advanced#safe-bins-stdin-only) 和 [Safe bins versus allowlist](/zh-CN/tools/exec-approvals-advanced#safe-bins-versus-allowlist)。

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
命令在产生输出或失败时可以唤醒会话。

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

粘贴（默认使用 bracketed 模式）：

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` 是 `exec` 的一个子工具，用于结构化的多文件编辑。
它默认对 OpenAI 和 OpenAI Codex 模型启用。只有在你想禁用它或将其限制为特定模型时，才需要使用配置：

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

- 仅对 OpenAI/OpenAI Codex 模型可用。
- 工具策略仍然适用；`allow: ["write"]` 会隐式允许 `apply_patch`。
- 配置位于 `tools.exec.applyPatch` 下。
- `tools.exec.applyPatch.enabled` 默认值为 `true`；将其设为 `false` 可对 OpenAI 模型禁用该工具。
- `tools.exec.applyPatch.workspaceOnly` 默认值为 `true`（限制在工作区内）。仅当你明确希望 `apply_patch` 在工作区目录之外写入 / 删除时，才将其设为 `false`。

## 相关内容

- [Exec Approvals](/zh-CN/tools/exec-approvals) — shell 命令的批准门控
- [沙箱隔离](/zh-CN/gateway/sandboxing) — 在沙箱隔离环境中运行命令
- [后台进程](/zh-CN/gateway/background-process) — 长时间运行的 exec 和 process 工具
- [安全](/zh-CN/gateway/security) — 工具策略和提升访问
