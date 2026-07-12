---
read_when:
    - 使用或修改 Exec 工具
    - 调试 stdin 或 TTY 行为
summary: Exec 工具用法、stdin 模式和 TTY 支持
title: Exec 工具
x-i18n:
    generated_at: "2026-07-12T14:47:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b8d7c3fcaa670851635cbd029d73f529a50be8c8c4df69565a1f96ea28757d04
    source_path: tools/exec.md
    workflow: 16
---

在工作区中运行 shell 命令。`exec` 是一个可变更 shell 接口：只要所选主机或沙箱文件系统允许，命令就可以在任何位置创建、编辑或删除文件。禁用 OpenClaw 文件系统工具（例如 `write`、`edit` 或 `apply_patch`）并不会使 `exec` 变为只读。

通过 `process` 支持前台和后台执行。如果不允许使用 `process`，`exec` 将同步运行，并忽略 `yieldMs`/`background`。后台会话按智能体隔离；`process` 只能看到同一智能体的会话。

## 参数

<ParamField path="command" type="string" required>
要运行的 shell 命令。
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
命令的工作目录。
</ParamField>

<ParamField path="env" type="object">
合并到继承环境之上的键值环境覆盖项。
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
经过此延迟（毫秒）后自动将命令转入后台。
</ParamField>

<ParamField path="background" type="boolean" default="false">
立即将命令转入后台，而不是等待 `yieldMs`。
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
以秒为单位，覆盖此调用配置的 exec 超时时间。适用于前台、后台、`yieldMs`、Gateway 网关、沙箱和节点 `system.run` 执行。`timeout: 0` 会禁用该调用的 exec 进程超时。
</ParamField>

<ParamField path="pty" type="boolean" default="false">
在可用时通过伪终端运行。用于仅支持 TTY 的 CLI、编码智能体和终端 UI。
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
执行位置。当沙箱运行时处于活动状态时，`auto` 解析为 `sandbox`；否则解析为 `gateway`。
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
普通工具调用会忽略此项。`gateway`/`node` 的安全策略由 `tools.exec.security` 和主机审批文件控制；只有当操作员明确授予提升权限访问时，提升模式才能强制使用 `security=full`。
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
基准询问模式来自 `tools.exec.ask` 和主机审批配置。对于源自渠道的模型调用，当主机的有效询问模式为 `off` 时，每次调用的 `ask` 会被忽略；否则，它只能收紧为更严格的模式。显式使用 `ask` 值构造 exec 工具的可信内部/API 调用方不受影响。
</ParamField>

<ParamField path="node" type="string">
当 `host=node` 时使用的节点 ID/名称。
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
请求提升模式：脱离沙箱并进入配置的主机路径。仅当提升模式解析为 `full` 时，才会强制使用 `security=full`。
</ParamField>

注意：

- `host` 仅接受 `auto`、`sandbox`、`gateway` 或 `node`。它不是主机名选择器；类似主机名的值会在命令运行前被拒绝。
- 每次调用可以从 `auto` 指定 `host=node`；仅当没有活动的沙箱运行时时，每次调用才可以指定 `host=gateway`。
- 无需额外配置，`host=auto` 仍然“开箱即用”：没有沙箱时解析为 `gateway`；存在活动沙箱时保留在沙箱内。
- `elevated` 会脱离沙箱并进入配置的主机路径：默认为 `gateway`；当 `tools.exec.host=node`（或会话默认为 `host=node`）时则进入 `node`。仅当当前会话/提供商启用了提升权限访问时，此功能才可用。
- `gateway`/`node` 审批由主机审批文件控制。
- `node` 需要已配对的节点（配套应用或无界面节点主机）。如果有多个可用节点，请设置 `exec.node` 或 `tools.exec.node` 以选择一个。
- `exec host=node` 是节点执行 shell 的唯一路径；旧版 `nodes.run` 包装器已被移除。
- 在非 Windows 主机上，exec 会在设置了 `SHELL` 时使用它；如果 `SHELL` 为 `fish`，则优先使用 `PATH` 中的 `bash`（或 `sh`），以避免与 fish 不兼容的 bash 语法；如果两者都不存在，则回退到 `SHELL`。
- 在 Windows 主机上，exec 优先查找 PowerShell 7（`pwsh`）（依次搜索 Program Files、ProgramW6432 和 PATH），然后回退到 Windows PowerShell 5.1。
- 在非 Windows Gateway 网关主机上，bash 和 zsh exec 命令使用启动快照。OpenClaw 会从 shell 启动文件中捕获可加载的别名/函数和一小组安全环境变量，将其写入 `$OPENCLAW_STATE_DIR/cache/shell-snapshots/`，然后在每条 exec 命令执行前加载该快照。疑似机密的变量会被排除；沙箱和节点 exec 不使用此快照。在 Gateway 网关进程环境中设置 `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` 可禁用此快照路径。
- 主机执行（`gateway`/`node`）会拒绝 `env.PATH` 和加载器覆盖项（`LD_*`/`DYLD_*`），以防止二进制文件劫持或代码注入。
- OpenClaw 会在生成的命令环境中（包括 PTY 和沙箱执行）设置 `OPENCLAW_SHELL=exec`，以便 shell/profile 规则能够检测 exec 工具上下文。
- 对于源自渠道的运行，如果渠道提供了相关 ID，OpenClaw 还会在 `OPENCLAW_CHANNEL_CONTEXT` 中公开一个范围受限的发送者/聊天身份 JSON 载荷。
- `exec` 无法运行 `openclaw channels login` 或 `/approve` shell 命令：`openclaw channels login` 是交互式渠道身份验证流程，而 `/approve` 必须通过审批命令处理程序执行，不能通过 shell 执行。请在 Gateway 网关主机的终端中运行渠道登录，或在存在渠道专用登录智能体工具时使用该工具（例如 `whatsapp_login`）。
- 重要提示：沙箱隔离**默认关闭**。如果沙箱隔离已关闭，隐式 `host=auto` 会解析为 `gateway`。显式指定 `host=sandbox` 仍会以失败关闭方式处理，而不会静默地在 Gateway 网关主机上运行。请启用沙箱隔离，或在审批机制下使用 `host=gateway`。
- 脚本预检（用于检查常见的 Python/Node shell 语法错误）仅检查有效 `workdir` 边界内的文件。如果脚本路径解析到 `workdir` 之外，则会跳过该文件的预检。当 `host=gateway` 且有效策略为 `security=full`、`ask=off` 时，也会完全跳过预检。
- 对于现在启动的长时间运行工作，只需启动一次，并在启用自动完成唤醒且命令产生输出或失败时依赖该机制。使用 `process` 获取日志、状态、输入或进行干预；不要使用 sleep 循环、超时循环或重复轮询来模拟调度。
- 对于应在稍后或按计划执行的工作，请使用 cron，而不是 `exec` 的 sleep/延迟模式。

## 配置

| 键                                   | 默认值                                                 | 说明                                                                                                                                                    |
| ------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools.exec.timeoutSec`              | `1800`                                                 | 每条 exec 命令的默认超时时间，以秒为单位。每次调用的 `timeout` 会覆盖它；每次调用设置 `timeout: 0` 会禁用 exec 进程超时。                                |
| `tools.exec.host`                    | `auto`                                                 | 当沙箱运行时处于活动状态时解析为 `sandbox`，否则解析为 `gateway`。                                                                                      |
| `tools.exec.security`                | 沙箱默认为 `deny`，未设置时 gateway/node 默认为 `full` |                                                                                                                                                         |
| `tools.exec.ask`                     | `off`                                                  |                                                                                                                                                         |
| `tools.exec.mode`                    | 未设置                                                 | 规范化的策略控制项。请参阅下方的[模式](#modes)。不能与 `tools.exec.security`/`tools.exec.ask` 组合使用。                                                |
| `tools.exec.reviewer.model`          | 配置的智能体主模型                                     | 用于 `mode=auto` 审查的可选提供商/模型覆盖项。                                                                                                          |
| `tools.exec.reviewer.timeoutMs`      | `30000`                                                | 在回退到人工处理之前，审查模型准备和完成阶段各自的超时时间。                                                                                            |
| `tools.exec.node`                    | 未设置                                                 |                                                                                                                                                         |
| `tools.exec.notifyOnExit`            | `true`                                                 | 为 true 时，转入后台的 exec 会话会在退出时将系统事件加入队列并请求一次 Heartbeat。                                                                      |
| `tools.exec.approvalRunningNoticeMs` | `10000`                                                | 当受审批约束的 exec 运行时间超过此值时，发出一次“正在运行”通知（`0` 表示禁用）。                                                                         |
| `tools.exec.strictInlineEval`        | `false`                                                | 请参阅[内联求值](#inline-eval-strictinlineeval)。                                                                                                       |
| `tools.exec.commandHighlighting`     | `false`                                                | 为 true 时，审批提示可以在命令文本中高亮显示解析器识别出的命令片段。可全局设置或按智能体设置；不会改变审批策略。                                        |
| `tools.exec.pathPrepend`             | 未设置                                                 | exec 运行时要添加到 `PATH` 前面的目录列表（仅限 gateway + 沙箱）。                                                                                      |
| `tools.exec.safeBins`                | 未设置                                                 | 仅从 stdin 接收输入、无需显式允许列表条目即可运行的安全二进制文件。请参阅[安全二进制文件](/zh-CN/tools/exec-approvals-advanced#safe-bins-stdin-only)。        |
| `tools.exec.safeBinTrustedDirs`      | `/bin`、`/usr/bin`                                     | 在 `safeBins` 路径检查中额外显式信任的目录。`PATH` 条目绝不会被自动信任。                                                                                |
| `tools.exec.safeBinProfiles`         | 未设置                                                 | 每个安全二进制文件的可选自定义 argv 策略（`minPositional`、`maxPositional`、`allowedValueFlags`、`deniedFlags`）。                                      |

Gateway 网关和节点默认使用无需审批的主机 exec（`security=full`、`ask=off`）——这来自主机策略默认值，而非 `host=auto`。如果你希望使用审批/允许列表行为，请同时收紧 `tools.exec.*` 和主机审批文件；请参阅 [Exec 审批](/zh-CN/tools/exec-approvals#yolo-mode-no-approval)。要无视沙箱状态强制路由到 Gateway 网关或节点，请设置 `tools.exec.host` 或使用 `/exec host=...`。

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

`tools.exec.mode` 是规范化的策略控制项。设置此项会派生 `security`/`ask`，且不能与显式的 `tools.exec.security`/`tools.exec.ask` 组合使用。

| 模式        | 安全策略    | 询问       | 行为                                                                                                                       |
| ----------- | ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `deny`      | `deny`      | `off`     | 拒绝执行 Exec。                                                                                                                |
| `allowlist` | `allowlist` | `off`     | 仅运行允许列表中的命令/安全二进制命令；不询问其他命令。                                                                 |
| `ask`       | `allowlist` | `on-miss` | 匹配允许列表的命令直接运行；其他所有命令都询问人工。                                                                  |
| `auto`      | `allowlist` | `on-miss` | 匹配允许列表/安全二进制命令的命令直接运行；其他所有命令先经过 OpenClaw 的原生自动审查器，再询问人工。 |
| `full`      | `full`      | `off`     | 无审批门控。                                                                                                              |

无论采用何种模式，`ask`/`ask=always` 仍会每次都询问人工。

自动审查批准仅可使用一次。在 Gateway 网关上，OpenClaw 会将解析后的可执行文件路径提供给审查器，并将执行固定到同一路径。无法归约为单个可强制执行计划的命令（例如 heredoc、shell 展开或不支持的包装器引号形式），即使模型原本会允许，也会回退到人工审批。

尚未由显式运行时策略或原生策略决定的 Codex app-server 命令审批将使用人工审批路径。OpenClaw 不会为这些请求运行其配置的 Exec 审查器，因为 Codex 不会公开可强制执行的已解析可执行文件，因而无法将审查决定绑定到 Codex 实际运行的命令。

### 内联求值（`strictInlineEval`）

当 `tools.exec.strictInlineEval` 为 `true` 时，内联解释器求值形式需要审查器或显式批准：`python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e`、`osascript -e`，以及其他受支持的解释器和命令载体中的类似形式（`awk`、`find -exec`、`make`、`sed`、`xargs` 等）。在 `mode=auto` 下，常规 Exec 审批路径可以让原生自动审查器允许明显低风险的一次性命令；直接调用节点主机的 `system.run` 仍需要显式批准，因为它们无法将命令交给人工审批路径。如果审查器要求询问，请求将转交人工。`allow-always` 仍可持久允许无害的解释器/脚本调用，但内联求值形式不会成为持久允许规则。

### PATH 处理

- `host=gateway`：将登录 shell 的 `PATH` 合并到 Exec 环境中。主机执行会拒绝 `env.PATH` 覆盖。守护进程本身仍使用最小化的 `PATH`：
  - macOS：`/opt/homebrew/bin`、`/usr/local/bin`、`/usr/bin`、`/bin`
  - Linux：`/usr/local/bin`、`/usr/bin`、`/bin`
  - 为防止用户 shell 配置（如 `~/.zshenv` 或 `/etc/zshenv`）在启动期间覆盖优先路径，`tools.exec.pathPrepend` 条目会在执行前，直接在 shell 命令内部安全地添加到最终 `PATH` 的开头。
- `host=sandbox`：在容器内运行 `sh -lc`（登录 shell），因此 `/etc/profile` 可能会重置 `PATH`。OpenClaw 会在加载配置文件后，通过内部环境变量将 `env.PATH` 添加到开头（不会进行 shell 插值）；`tools.exec.pathPrepend` 在此处也适用。
- `host=node`：仅将你传入且未被阻止的环境覆盖发送到节点。主机执行会拒绝 `env.PATH` 覆盖，而节点主机会忽略这些覆盖。如果需要在节点上添加额外的 PATH 条目，请配置节点主机服务环境（systemd/launchd），或将工具安装到标准位置。

按智能体绑定节点（使用配置中智能体列表的索引）：

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Control UI：**设备**页面包含一个小型的“Exec 节点绑定”面板，用于配置相同的设置。

## 会话覆盖（`/exec`）

使用 `/exec` 设置 `host`、`security`、`ask` 和 `node` 的**每会话**默认值。不带参数发送 `/exec` 可显示当前值。

示例：

```text
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

仅对**已授权发送者**接受 `/exec`（渠道允许列表/配对以及 `commands.useAccessGroups`）。它只更新**会话状态**，不会写入配置。已授权的外部渠道发送者可以设置这些会话默认值。内部 Gateway 网关/webchat 客户端需要 `operator.admin` 才能持久保存这些设置。

如需彻底禁用 Exec，请通过工具策略拒绝它（`tools.deny: ["exec"]` 或按智能体配置）。除非显式设置 `security=full` 和 `ask=off`，否则主机审批仍然适用。

## Exec 审批（配套应用/节点主机）

沙箱隔离的智能体可以要求每次请求获得批准后，才允许 `exec` 在 Gateway 网关或节点主机上运行。有关策略、允许列表和 UI 流程，请参阅 [Exec 审批](/zh-CN/tools/exec-approvals)。

需要人工审批时，节点主机和非原生 Gateway 网关流程会立即返回 `status: "approval-pending"` 和审批 ID。原生聊天和 Web UI Gateway 网关流程则可以原地等待，并在批准后返回最终命令结果。`approval-pending` 结果表示命令尚未启动，因此只有在获批命令确实以内联方式运行时，才会显示前台回退警告。获批的异步运行会发出命令进度和完成系统事件（`Exec running` / `Exec finished`）；被拒绝或超时的审批是终止状态，不会通过拒绝系统事件唤醒智能体会话。

对于具有原生审批卡片/按钮的渠道，智能体应优先依赖该原生 UI；仅当工具结果明确指出聊天审批不可用或手动审批是唯一路径时，才应包含手动 `/approve` 命令。

## 允许列表 + 安全二进制命令

手动允许列表强制执行会匹配解析后的二进制文件路径 glob 和裸命令名称 glob。裸名称仅匹配通过 PATH 调用的命令，因此当命令为 `rg` 时，`rg` 可以匹配 `/opt/homebrew/bin/rg`，但不能匹配 `./rg` 或 `/tmp/rg`。

当 `security=allowlist` 时，只有在管道的每一段都位于允许列表中或属于安全二进制命令时，shell 命令才会被自动允许。在允许列表模式下，除非每个顶层命令段都满足允许列表要求（包括安全二进制命令），否则会拒绝命令串联（`;`、`&&`、`||`）和重定向。重定向仍不受支持。持久的 `allow-always` 信任不会绕过该规则：串联命令仍要求每个顶层命令段都匹配。

`autoAllowSkills` 是 Exec 审批中的一个独立便捷路径，与手动路径允许列表条目不同。若要实施严格的显式信任，请保持禁用 `autoAllowSkills`。

这两类控制项用于不同用途：

- `tools.exec.safeBins`：仅使用 stdin 的小型流过滤器。
- `tools.exec.safeBinTrustedDirs`：为安全二进制文件的可执行文件路径显式添加额外的受信任目录。
- `tools.exec.safeBinProfiles`：为自定义安全二进制文件设置显式 argv 策略。
- 允许列表：对可执行文件路径的显式信任。

不要将 `safeBins` 当作通用允许列表，也不要添加解释器/运行时二进制文件（例如 `python3`、`node`、`ruby`、`bash`）。如果需要使用这些程序，请添加显式允许列表条目，并保持启用审批提示。

当解释器/运行时 `safeBins` 条目缺少显式配置文件时，`openclaw security audit` 会发出警告，而 `openclaw doctor --fix` 可以为缺失的自定义 `safeBinProfiles` 条目生成基础配置。当你显式将 `jq` 等行为范围较广的二进制文件重新添加到 `safeBins` 时，`openclaw security audit` 和 `openclaw doctor` 也会发出警告（`jq` 可以读取环境数据，并从模块或启动文件加载 jq 代码，因此应优先使用显式允许列表条目或需经审批的运行方式）。即使明确列出，`jq` 也不得作为安全二进制文件使用。如果你明确将解释器加入允许列表，请启用 `tools.exec.strictInlineEval`，以便内联代码求值形式仍需审核者审批或显式审批。

有关完整的策略详情和示例，请参阅 [Exec 审批](/zh-CN/tools/exec-approvals-advanced#safe-bins-stdin-only)和[安全二进制文件与允许列表的对比](/zh-CN/tools/exec-approvals-advanced#safe-bins-versus-allowlist)。

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

轮询用于按需查询状态，而不是等待循环。如果已启用自动完成唤醒，命令在产生输出或失败时可以唤醒会话。

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

粘贴（默认使用括号粘贴模式）：

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` 是 `exec` 的子工具，用于进行结构化的多文件编辑。它默认启用，适用于任何模型提供商；可通过 `allowModels` 对其进行限制。仅当你希望禁用它或将其限制为特定模型时才需要使用配置：

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.6-sol"] },
    },
  },
}
```

注意事项：

- 工具策略仍然适用；`allow: ["write"]` 会隐式允许 `apply_patch`。
- `deny: ["write"]` 不会拒绝 `apply_patch`；如果还应阻止补丁写入，请显式拒绝 `apply_patch` 或使用 `deny: ["group:fs"]`。
- 配置位于 `tools.exec.applyPatch` 下。
- `tools.exec.applyPatch.enabled` 默认为 `true`；将其设为 `false` 可禁用该工具。
- `tools.exec.applyPatch.workspaceOnly` 默认为 `true`（限制在工作区内）。仅当你确实希望 `apply_patch` 在工作区目录之外写入/删除内容时，才将其设为 `false`。
- `tools.exec.applyPatch.allowModels` 是可选的模型 ID 允许列表（可以是原始格式，如 `gpt-5.4`；也可以是完整格式，如 `openai/gpt-5.4`）。设置后，只有匹配的模型才能获得该工具；未设置时，所有模型都能获得该工具。

## 相关内容

- [Exec 审批](/zh-CN/tools/exec-approvals) — shell 命令的审批关卡
- [沙箱隔离](/zh-CN/gateway/sandboxing) — 在沙箱隔离环境中运行命令
- [后台进程](/zh-CN/gateway/background-process) — 长时间运行的 Exec 和 process 工具
- [安全性](/zh-CN/gateway/security) — 工具策略和提升权限访问
