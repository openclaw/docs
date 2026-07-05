---
read_when:
    - 使用或修改 Exec 工具
    - 调试 stdin 或 TTY 行为
summary: Exec 工具用法、stdin 模式和 TTY 支持
title: Exec 工具
x-i18n:
    generated_at: "2026-07-05T11:44:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64121c1affd7d44ebac49b2cd1986ad393e90a52ddc66d4ddefdfecb4bffa17b
    source_path: tools/exec.md
    workflow: 16
---

在工作区中运行 shell 命令。`exec` 是可变更的 shell 表面：只要所选主机或沙箱文件系统允许，命令就可以创建、编辑或删除文件。禁用 OpenClaw 文件系统工具（例如 `write`、`edit` 或 `apply_patch`）不会让 `exec` 变成只读。

通过 `process` 支持前台和后台执行。如果不允许使用 `process`，`exec` 会同步运行并忽略 `yieldMs`/`background`。后台会话按智能体划定范围；`process` 只能看到同一智能体的会话。

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
在此延迟后自动将命令转入后台（毫秒）。
</ParamField>

<ParamField path="background" type="boolean" default="false">
立即将命令转入后台，而不是等待 `yieldMs`。
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
覆盖此次调用配置的 exec 超时时间，单位为秒。适用于前台、后台、`yieldMs`、Gateway 网关、沙箱和节点 `system.run` 执行。`timeout: 0` 会禁用该次调用的 exec 进程超时。
</ParamField>

<ParamField path="pty" type="boolean" default="false">
可用时在伪终端中运行。用于仅支持 TTY 的 CLI、编码智能体和终端 UI。
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
执行位置。`auto` 在沙箱运行时处于活动状态时解析为 `sandbox`，否则解析为 `gateway`。
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
普通工具调用会忽略此项。`gateway`/`node` 安全由 `tools.exec.security` 和主机审批文件控制；只有在操作员明确授予提升访问权限时，提升权限模式才能强制使用 `security=full`。
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
基线询问模式来自 `tools.exec.ask` 和主机审批。对于来自渠道的模型调用，当有效主机询问为 `off` 时，会忽略每次调用的 `ask`；否则它只能收紧为更严格的模式。使用显式 `ask` 值构造 exec 工具的受信任内部/API 调用方保持不变。
</ParamField>

<ParamField path="node" type="string">
当 `host=node` 时的节点 id/名称。
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
请求提升权限模式：逃逸沙箱并进入配置的主机路径。只有当 elevated 解析为 `full` 时，才会强制使用 `security=full`。
</ParamField>

说明：

- `host` 只接受 `auto`、`sandbox`、`gateway` 或 `node`。它不是主机名选择器；类似主机名的值会在命令运行前被拒绝。
- 每次调用的 `host=node` 可从 `auto` 使用；每次调用的 `host=gateway` 只在没有活动沙箱运行时时允许。
- 在没有额外配置时，`host=auto` 仍然“直接可用”：没有沙箱时解析为 `gateway`；有活动沙箱时则保留在沙箱中。
- `elevated` 会逃逸沙箱并进入配置的主机路径：默认是 `gateway`，或者当 `tools.exec.host=node`（或会话默认值为 `host=node`）时是 `node`。仅当当前会话/提供商启用了提升权限访问时才可用。
- `gateway`/`node` 审批由主机审批文件控制。
- `node` 需要已配对的节点（配套应用或无头节点主机）。如果有多个节点可用，请设置 `exec.node` 或 `tools.exec.node` 来选择一个。
- `exec host=node` 是节点的唯一 shell 执行路径；旧版 `nodes.run` 包装器已移除。
- 在非 Windows 主机上，exec 会在设置了 `SHELL` 时使用它；如果 `SHELL` 是 `fish`，则优先使用 `PATH` 中的 `bash`（或 `sh`）以避免与 fish 不兼容的 bash 用法，然后在两者都不存在时回退到 `SHELL`。
- 在 Windows 主机上，exec 优先发现 PowerShell 7（`pwsh`）（Program Files、ProgramW6432，然后是 PATH），然后回退到 Windows PowerShell 5.1。
- 在非 Windows Gateway 网关主机上，bash 和 zsh exec 命令使用启动快照。OpenClaw 会从 shell 启动文件中捕获可 source 的别名/函数和一组小型安全环境变量到 `$OPENCLAW_STATE_DIR/cache/shell-snapshots/`，然后在每个 exec 命令前 source 该快照。看起来像密钥的变量会被排除；沙箱和节点 exec 不使用此快照。在 Gateway 网关进程环境中设置 `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` 可禁用此快照路径。
- 主机执行（`gateway`/`node`）会拒绝 `env.PATH` 和加载器覆盖项（`LD_*`/`DYLD_*`），以防止二进制劫持或注入代码。
- OpenClaw 会在生成的命令环境中设置 `OPENCLAW_SHELL=exec`（包括 PTY 和沙箱执行），以便 shell/profile 规则可以检测 exec 工具上下文。
- 对于来自渠道的运行，当渠道提供了发送方/聊天身份 id 时，OpenClaw 还会在 `OPENCLAW_CHANNEL_CONTEXT` 中公开一个窄范围的发送方/聊天身份 JSON 载荷。
- `exec` 不能运行 `openclaw channels login` 或 `/approve` shell 命令：`openclaw channels login` 是交互式渠道认证流程，而 `/approve` 需要通过审批命令处理器，不是 shell。在 Gateway 网关主机上的终端中运行渠道登录，或者在存在渠道专用登录智能体工具时使用它（例如 `whatsapp_login`）。
- 重要：沙箱隔离默认**关闭**。如果沙箱隔离关闭，隐式 `host=auto` 会解析为 `gateway`。显式 `host=sandbox` 仍会失败关闭，而不是静默地在 Gateway 网关主机上运行。启用沙箱隔离，或在带审批的情况下使用 `host=gateway`。
- 脚本预检检查（用于常见 Python/Node shell 语法错误）只检查有效 `workdir` 边界内的文件。如果脚本路径解析到 `workdir` 之外，则会跳过该文件的预检。当 `host=gateway` 且有效策略为 `security=full` 和 `ask=off` 时，预检也会完全跳过。
- 对于现在开始的长时间运行工作，只启动一次，并在启用自动完成唤醒且命令发出输出或失败时依赖它。使用 `process` 查看日志、状态、输入或进行干预；不要用 sleep 循环、timeout 循环或重复轮询来模拟调度。
- 对于应在稍后或按计划发生的工作，请使用 cron，而不是 `exec` sleep/delay 模式。

## 配置

| 键                                   | 默认值                                                 | 说明                                                                                                                                                    |
| ------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools.exec.timeoutSec`              | `1800`                                                 | 默认的每命令 exec 超时时间，单位为秒。每次调用的 `timeout` 会覆盖它；每次调用的 `timeout: 0` 会禁用 exec 进程超时。                                    |
| `tools.exec.host`                    | `auto`                                                 | 当沙箱运行时处于活动状态时解析为 `sandbox`，否则解析为 `gateway`。                                                                                      |
| `tools.exec.security`                | 沙箱为 `deny`，未设置时 Gateway 网关/节点为 `full`     |                                                                                                                                                         |
| `tools.exec.ask`                     | `off`                                                  |                                                                                                                                                         |
| `tools.exec.mode`                    | 未设置                                                 | 规范化的策略旋钮。见下方[模式](#modes)。不能与 `tools.exec.security`/`tools.exec.ask` 组合使用。                                                       |
| `tools.exec.node`                    | 未设置                                                 |                                                                                                                                                         |
| `tools.exec.notifyOnExit`            | `true`                                                 | 为 true 时，转入后台的 exec 会话会在退出时排入一个系统事件并请求一次 Heartbeat。                                                                        |
| `tools.exec.approvalRunningNoticeMs` | `10000`                                                | 当受审批控制的 exec 运行时间超过此值时，发出一次“运行中”通知（`0` 会禁用）。                                                                            |
| `tools.exec.strictInlineEval`        | `false`                                                | 见[内联 eval](#inline-eval-strictinlineeval)。                                                                                                          |
| `tools.exec.commandHighlighting`     | `false`                                                | 为 true 时，审批提示可以在命令文本中高亮解析器派生的命令片段。可全局设置或按智能体设置；不会改变审批策略。                                            |
| `tools.exec.pathPrepend`             | 未设置                                                 | 要前置到 exec 运行的 `PATH` 的目录列表（仅 Gateway 网关 + 沙箱）。                                                                                       |
| `tools.exec.safeBins`                | 未设置                                                 | 仅 stdin 的安全二进制文件，无需显式 allowlist 条目即可运行。见[安全二进制文件](/zh-CN/tools/exec-approvals-advanced#safe-bins-stdin-only)。                   |
| `tools.exec.safeBinTrustedDirs`      | `/bin`, `/usr/bin`                                     | 用于 `safeBins` 路径检查的其他显式受信任目录。`PATH` 条目永远不会自动受信任。                                                                           |
| `tools.exec.safeBinProfiles`         | 未设置                                                 | 每个安全二进制文件的可选自定义 argv 策略（`minPositional`、`maxPositional`、`allowedValueFlags`、`deniedFlags`）。                                      |

免审批主机 exec 是 Gateway 网关和节点的默认值（`security=full`、`ask=off`），这来自主机策略默认值，而不是来自 `host=auto`。如果你想要审批/allowlist 行为，请同时收紧 `tools.exec.*` 和主机审批文件；见 [Exec 审批](/zh-CN/tools/exec-approvals#yolo-mode-no-approval)。要不管沙箱状态如何都强制 Gateway 网关或节点路由，请设置 `tools.exec.host` 或使用 `/exec host=...`。

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

### 模式

`tools.exec.mode` 是规范化的策略旋钮。设置它会派生 `security`/`ask`，并且不能与显式 `tools.exec.security`/`tools.exec.ask` 组合使用。

| 模式        | security    | ask       | 行为                                                                                                                           |
| ----------- | ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `deny`      | `deny`      | `off`     | Exec 被拒绝。                                                                                                                  |
| `allowlist` | `allowlist` | `off`     | 只运行允许列表中的命令或 safe-bin 命令；不会询问其他内容。                                                                      |
| `ask`       | `allowlist` | `on-miss` | 匹配允许列表的命令会直接运行；其他所有内容都会询问人工。                                                                        |
| `auto`      | `allowlist` | `on-miss` | 匹配允许列表或 safe-bin 的命令会直接运行；其他所有内容会先经过 OpenClaw 原生自动审阅器，再询问人工。                           |
| `full`      | `full`      | `off`     | 没有审批门禁。                                                                                                                  |

`ask`/`ask=always` 仍然会每次都询问人工，无论模式如何。

### 内联 eval（`strictInlineEval`）

当 `tools.exec.strictInlineEval` 为 `true` 时，内联解释器 eval 形式需要审阅器或显式审批：`python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e`、`osascript -e`，以及其他受支持解释器和命令承载器中的类似形式（`awk`、`find -exec`、`make`、`sed`、`xargs` 等）。在 `mode=auto` 中，正常的 Exec 审批路径可能允许原生自动审阅器放行明确低风险的一次性命令；直接的 node-host `system.run` 调用仍然需要显式审批，因为它们无法把命令交给人工审批路径。如果审阅器要求，请求会转给人工。`allow-always` 仍可持久化良性的解释器/脚本调用，但内联 eval 形式不会变成持久允许规则。

### PATH 处理

- `host=gateway`：将你的登录 shell `PATH` 合并到 Exec 环境中。主机执行会拒绝 `env.PATH` 覆盖。守护进程本身仍使用最小 `PATH`：
  - macOS：`/opt/homebrew/bin`、`/usr/local/bin`、`/usr/bin`、`/bin`
  - Linux：`/usr/local/bin`、`/usr/bin`、`/bin`
  - 为防止用户 shell 配置（如 `~/.zshenv` 或 `/etc/zshenv`）在启动期间覆盖优先路径，`tools.exec.pathPrepend` 条目会在执行前，在 shell 命令内部被安全地前置到最终 `PATH`。
- `host=sandbox`：在容器内运行 `sh -lc`（登录 shell），因此 `/etc/profile` 可能会重置 `PATH`。OpenClaw 会在 profile 来源加载后，通过内部环境变量前置 `env.PATH`（无 shell 插值）；`tools.exec.pathPrepend` 也适用于这里。
- `host=node`：只会把你传入的未被阻止的环境覆盖发送到节点。主机执行会拒绝 `env.PATH` 覆盖，节点主机会忽略它。如果你需要在节点上添加额外的 PATH 条目，请配置节点主机服务环境（systemd/launchd），或将工具安装到标准位置。

按 Agent 绑定节点（在配置中使用 Agent 列表索引）：

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Control UI：Nodes 标签页包含一个小型 “Exec node binding” 面板，用于相同设置。

## 会话覆盖（`/exec`）

使用 `/exec` 为 `host`、`security`、`ask` 和 `node` 设置**按会话**默认值。发送不带参数的 `/exec` 可显示当前值。

示例：

```text
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

`/exec` 仅对**已授权发送者**生效（渠道 allowlist/配对，加上 `commands.useAccessGroups`）。它只更新**会话状态**，不会写入配置。已授权的外部渠道发送者可以设置这些会话默认值。内部 gateway/webchat 客户端需要 `operator.admin` 才能持久化它们。

若要硬禁用 Exec，请通过工具策略拒绝它（`tools.deny: ["exec"]` 或按 Agent 设置）。除非你显式设置 `security=full` 和 `ask=off`，否则主机审批仍会适用。

## Exec 审批（配套应用 / 节点主机）

沙箱隔离的智能体可以要求在 `exec` 于 Gateway 网关或节点主机上运行前进行逐请求审批。请参阅 [Exec 审批](/zh-CN/tools/exec-approvals) 了解策略、允许列表和 UI 流程。

需要审批时，Exec 工具会立即返回 `status: "approval-pending"` 和一个审批 id。一旦批准（或拒绝/超时），Gateway 网关仅针对已批准运行发出命令进度和完成系统事件（`Exec running` / `Exec finished`）。被拒绝或超时的审批是终态，不会用拒绝系统事件唤醒 Agent 会话。

在有原生审批卡片/按钮的渠道上，Agent 应优先依赖该原生 UI，只有在工具结果明确表示聊天审批不可用或手动审批是唯一路径时，才包含手动 `/approve` 命令。

## 允许列表 + safe bins

手动允许列表强制会匹配解析后的二进制路径 glob 和裸命令名 glob。裸名称只匹配通过 PATH 调用的命令，因此当命令为 `rg` 时，`rg` 可以匹配 `/opt/homebrew/bin/rg`，但不能匹配 `./rg` 或 `/tmp/rg`。

当 `security=allowlist` 时，只有在每个管道段都位于允许列表中或是 safe bin 时，shell 命令才会被自动允许。在 allowlist 模式下，除非每个顶层段都满足允许列表（包括 safe bins），否则链式命令（`;`、`&&`、`||`）和重定向会被拒绝。重定向仍不受支持。持久 `allow-always` 信任不会绕过该规则：链式命令仍要求每个顶层段都匹配。

`autoAllowSkills` 是 Exec 审批中的独立便捷路径，不等同于手动路径允许列表条目。若需要严格显式信任，请保持 `autoAllowSkills` 禁用。

这两个控件适用于不同用途：

- `tools.exec.safeBins`：小型、仅 stdin 的流过滤器。
- `tools.exec.safeBinTrustedDirs`：safe-bin 可执行路径的显式额外受信目录。
- `tools.exec.safeBinProfiles`：自定义 safe bins 的显式 argv 策略。
- 允许列表：对可执行路径的显式信任。

不要把 `safeBins` 当作通用允许列表，也不要添加解释器/运行时二进制文件（例如 `python3`、`node`、`ruby`、`bash`）。如果需要这些，请使用显式允许列表条目，并保持审批提示启用。

当解释器/运行时 `safeBins` 条目缺少显式 profile 时，`openclaw security audit` 会发出警告，`openclaw doctor --fix` 可以搭建缺失的自定义 `safeBinProfiles` 条目。当你显式将 `jq` 等宽行为 bin 加回 `safeBins` 时，`openclaw security audit` 和 `openclaw doctor` 也会发出警告（`jq` 支持广泛的程序和内置功能，因此优先使用显式允许列表条目或审批门禁运行）。如果你显式允许解释器，请启用 `tools.exec.strictInlineEval`，使内联代码 eval 形式仍然需要审阅器或显式审批。

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

轮询用于按需状态，而不是等待循环。如果启用了自动完成唤醒，命令在发出输出或失败时可以唤醒会话。

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

`apply_patch` 是 `exec` 的子工具，用于结构化多文件编辑。它默认启用，并可供任何模型提供商使用；`allowModels` 可以限制它。仅当你想禁用它或将其限制为特定模型时，才使用配置：

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

- 工具策略仍然适用；`allow: ["write"]` 会隐式允许 `apply_patch`。
- `deny: ["write"]` 不会拒绝 `apply_patch`；请显式拒绝 `apply_patch`，或在补丁写入也应被阻止时使用 `deny: ["group:fs"]`。
- 配置位于 `tools.exec.applyPatch` 下。
- `tools.exec.applyPatch.enabled` 默认为 `true`；将其设为 `false` 可禁用该工具。
- `tools.exec.applyPatch.workspaceOnly` 默认为 `true`（限制在工作区内）。只有在你有意让 `apply_patch` 写入/删除工作区目录之外的内容时，才将其设为 `false`。
- `tools.exec.applyPatch.allowModels` 是模型 id 的可选允许列表（原始形式，如 `gpt-5.4`，或完整形式，如 `openai/gpt-5.4`）。设置后，只有匹配的模型会获得该工具；未设置时，所有模型都会获得它。

## 相关内容

- [Exec 审批](/zh-CN/tools/exec-approvals) — shell 命令的审批门禁
- [沙箱隔离](/zh-CN/gateway/sandboxing) — 在沙箱隔离环境中运行命令
- [后台进程](/zh-CN/gateway/background-process) — 长时间运行的 Exec 和 process 工具
- [Security](/zh-CN/gateway/security) — 工具策略和提升权限访问
