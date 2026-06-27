---
read_when:
    - 配置 Exec 审批或允许列表
    - 在 macOS 应用中实现 Exec 审批用户体验
    - 审查沙箱逃逸提示及其影响
sidebarTitle: Exec approvals
summary: 主机 Exec 审批：策略旋钮、白名单和 YOLO/严格工作流
title: Exec 审批
x-i18n:
    generated_at: "2026-06-27T03:27:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a4a5c9c56da458fdb25d5fe698df305af17188695d8befc1d4cfd8e8333e96
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec 审批是**配套应用 / 节点主机护栏**，用于允许沙箱隔离的智能体在真实主机（`gateway` 或 `node`）上运行命令。它是一个安全联锁：只有当策略 + 允许列表 +（可选）用户审批全部一致时，命令才会被允许。Exec 审批叠加在工具策略和提升权限门控**之上**（除非提升权限设置为 `full`，这会跳过审批）。

如需按模式优先了解 `deny`、`allowlist`、`ask`、`auto`、`full`、Codex Guardian 映射和 ACPX harness 权限，请参阅
[权限模式](/zh-CN/tools/permission-modes)。

<Note>
有效策略是 `tools.exec.*` 和审批默认值中**更严格**的一个；如果省略某个审批字段，则使用 `tools.exec` 值。主机 exec 还会使用该机器上的本地审批状态 - 执行主机审批文件中的主机本地 `ask: "always"` 会持续提示，即使会话或配置默认值请求 `ask: "on-miss"`。
</Note>

## 检查有效策略

| 命令                                                             | 显示内容                                                                               |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | 请求的策略、主机策略来源，以及有效结果。                                               |
| `openclaw exec-policy show`                                      | 本地机器合并后的视图。                                                                 |
| `openclaw exec-policy set` / `preset`                            | 一步同步本地请求策略和本地主机审批文件。                                               |

当本地作用域请求 `host=node` 时，`exec-policy show` 会报告该作用域在运行时由节点管理，而不是假装本地审批文件是真实来源。

如果配套应用 UI **不可用**，任何通常会提示的请求都会由 **ask 回退**解析（默认：`deny`）。

<Tip>
原生聊天审批客户端可以在待处理审批消息上预置特定渠道的便捷操作。例如，Matrix 会预置回应快捷方式（`✅` 允许一次，`❌` 拒绝，`♾️` 始终允许），同时仍在消息中保留 `/approve ...` 命令作为回退。
</Tip>

## 适用位置

Exec 审批在执行主机本地强制执行：

- **Gateway 网关主机** → Gateway 网关机器上的 `openclaw` 进程。
- **节点主机** → 节点运行器（macOS 配套应用或无头节点主机）。

### 信任模型

- 通过 Gateway 网关认证的调用方是该 Gateway 网关的可信操作员。
- 已配对节点会把该可信操作员能力扩展到节点主机。
- Exec 审批会降低意外执行风险，但**不是**按用户划分的鉴权边界或文件系统只读策略。
- 一旦审批通过，命令就可以根据所选主机或沙箱文件系统权限修改文件。
- 已审批的节点主机运行会绑定规范执行上下文：规范 cwd、精确 argv、存在时的 env 绑定，以及适用时的固定可执行文件路径。
- 对于 shell 脚本和直接解释器/运行时文件调用，OpenClaw 还会尝试绑定一个具体的本地文件操作数。如果该绑定文件在审批后、执行前发生变化，运行会被拒绝，而不是执行已漂移的内容。
- 文件绑定有意采用尽力而为，**不是**每个解释器/运行时加载器路径的完整语义模型。如果审批模式无法精确识别一个具体的本地文件来绑定，它会拒绝生成由审批背书的运行，而不是假装覆盖完整。

### macOS 拆分

- **节点主机服务**通过 local loopback IPC 将 `system.run` 转发给 **macOS app**。
- **macOS app**强制执行审批，并在 UI 上下文中执行命令。

## 设置和存储

审批存放在执行主机上的本地 JSON 文件中。当设置了 `OPENCLAW_STATE_DIR` 时，文件会跟随该状态目录；否则使用默认 OpenClaw 状态目录：

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# otherwise
~/.openclaw/exec-approvals.json
```

默认审批 socket 跟随同一根目录：
`$OPENCLAW_STATE_DIR/exec-approvals.sock`，或在未设置变量时使用
`~/.openclaw/exec-approvals.sock`。

示例 schema：

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "source": "allow-always",
          "commandText": "rg -n TODO",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## 策略旋钮

### `tools.exec.mode`

`tools.exec.mode` 是主机 exec 首选的规范化策略表面。取值为：

- `deny` - 阻止主机 exec。
- `allowlist` - 只运行允许列表中的命令，不询问。
- `ask` - 使用允许列表策略，并在未命中时询问。
- `auto` - 使用允许列表策略，直接运行确定性匹配，并在回退到人工审批路径之前，将审批未命中发送给 OpenClaw 的原生自动审查器。
- `full` - 无审批提示地运行主机 exec。

旧版 `tools.exec.security` / `tools.exec.ask` 仍受支持，并且在更窄的会话或智能体作用域中设置时仍会优先。

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - 阻止所有主机 exec 请求。
  - `allowlist` - 只允许允许列表中的命令。
  - `full` - 允许所有内容（等同于提升权限）。

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  为主机 exec 配置的询问策略。控制来自 `tools.exec.ask` 和主机审批默认值的基线审批提示行为。每次调用的 `ask` 工具参数（见 [Exec 工具](/zh-CN/tools/exec#parameters)）只能加固该基线，并且当有效主机 ask 为 `off` 时，来自渠道的模型调用会忽略它。

- `off` - 从不提示。
- `on-miss` - 仅当允许列表不匹配时提示。
- `always` - 每条命令都提示。当有效 ask 模式为 `always` 时，`allow-always` 持久信任**不会**抑制提示。

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  需要提示但没有可达 UI 时的解析方式。如果省略此字段，OpenClaw 默认使用 `deny`。

- `deny` - 阻止。
- `allowlist` - 仅当允许列表匹配时允许。
- `full` - 允许。

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  当为 `true` 时，OpenClaw 会将内联代码求值形式视为仅能通过审批，即使解释器二进制文件本身在允许列表中。这是针对无法干净映射到一个稳定文件操作数的解释器加载器的纵深防御。
</ParamField>

严格模式会捕获的示例：

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

在严格模式下，这些命令仍需要显式审批，并且 `allow-always` 不会自动为它们持久化新的允许列表条目。

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  仅控制 exec 审批提示中的呈现。启用后，OpenClaw 可以附加由解析器派生的命令 span，使 Web 审批提示能够高亮命令 token。将其设置为 `true` 可启用命令文本高亮。
</ParamField>

此设置**不会**更改 `security`、`ask`、允许列表匹配、严格内联求值行为、审批转发或命令执行。它可以在全局 `tools.exec.commandHighlighting` 下设置，或按智能体在 `agents.list[].tools.exec.commandHighlighting` 下设置。

## YOLO 模式（无审批）

如果你希望主机 exec 无审批提示地运行，必须打开**两个**策略层 - OpenClaw 配置中的请求 exec 策略（`tools.exec.*`）**以及**执行主机审批文件中的主机本地审批策略。

OpenClaw 会将省略的 `askFallback` 默认设为 `deny`。当无 UI 的审批提示应回退为允许时，请显式将主机 `askFallback` 设置为 `full`。

| 层级                  | YOLO 设置                 |
| --------------------- | ------------------------- |
| `tools.exec.security` | `gateway`/`node` 上的 `full` |
| `tools.exec.ask`      | `off`                     |
| 主机 `askFallback`    | `full`                    |

<Warning>
**重要区别：**

- `tools.exec.host=auto` 选择 exec 在**哪里**运行：可用时使用沙箱，否则使用 Gateway 网关。
- YOLO 选择主机 exec **如何**审批：`security=full` 加 `ask=off`。
- 在 YOLO 模式下，OpenClaw **不会**在配置的主机 exec 策略之上添加单独的启发式命令混淆审批门控或脚本预检拒绝层。
- `auto` 不会让 Gateway 网关路由成为沙箱隔离会话中的自由覆盖。来自 `auto` 的每次调用 `host=node` 请求是允许的；只有在没有活动沙箱运行时时，来自 `auto` 的 `host=gateway` 才允许。若需要稳定的非 auto 默认值，请设置 `tools.exec.host` 或显式使用 `/exec host=...`。

</Warning>

暴露自身非交互权限模式的 CLI 后端提供商可以遵循此策略。当 OpenClaw 的有效 exec 策略为 YOLO 时，Claude CLI 会添加
`--permission-mode bypassPermissions`。对于 OpenClaw 管理的 Claude live 会话，OpenClaw 的有效 exec 策略优先于 Claude 的原生权限模式：YOLO 会将 live 启动规范化为 `--permission-mode bypassPermissions`，而限制性的有效 exec 策略会将 live 启动规范化为
`--permission-mode default`，即使原始 Claude 后端参数指定了另一种模式。

如果你想要更保守的设置，请将 OpenClaw exec 策略收紧回
`allowlist` / `on-miss` 或 `deny`。

### 持久 Gateway 网关主机“从不提示”设置

<Steps>
  <Step title="设置请求的配置策略">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="匹配主机审批文件">
    ```bash
    openclaw approvals set --stdin <<'EOF'
    {
      version: 1,
      defaults: {
        security: "full",
        ask: "off",
        askFallback: "full"
      }
    }
    EOF
    ```
  </Step>
</Steps>

### 本地快捷方式

```bash
openclaw exec-policy preset yolo
```

该本地快捷方式会同时更新：

- 本地 `tools.exec.host/security/ask`。
- 本地审批文件默认值，包括 `askFallback: "full"`。

它有意仅限本地使用。若要远程更改 Gateway 网关主机或节点主机审批，请使用 `openclaw approvals set --gateway` 或
`openclaw approvals set --node <id|name|ip>`。

### 节点主机

对于节点主机，请改为在该节点上应用相同的审批文件：

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

<Note>
**仅本地限制：**

- `openclaw exec-policy` 不会同步节点审批。
- `openclaw exec-policy set --host node` 会被拒绝。
- 节点 exec 审批会在运行时从节点获取，因此面向节点的更新必须使用 `openclaw approvals --node ...`。

</Note>

### 仅会话快捷方式

- `/exec security=full ask=off` 只会更改当前会话。
- `/elevated full` 是一个紧急旁路快捷方式，只有当请求的策略和主机审批文件都解析为
  `security: "full"` 和 `ask: "off"` 时，才会跳过 Exec 审批。更严格的主机文件，例如
  `ask: "always"`，仍会提示。

如果主机审批文件比配置更严格，更严格的主机策略仍然优先。

## 允许列表（按智能体）

允许列表是**按智能体**生效的。如果存在多个智能体，请在 macOS 应用中切换你正在编辑的智能体。模式是 glob 匹配。

模式可以是已解析的二进制路径 glob，也可以是裸命令名 glob。
裸名称只匹配通过 `PATH` 调用的命令，所以当命令是 `rg` 时，`rg` 可以匹配
`/opt/homebrew/bin/rg`，但**不会**匹配 `./rg` 或
`/tmp/rg`。当你想信任某个特定二进制位置时，请使用路径 glob。

旧版 `agents.default` 条目会在加载时迁移到 `agents.main`。
像 `echo ok && pwd` 这样的 shell 链仍需要每个顶层片段都满足允许列表规则。

示例：

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### 使用 argPattern 限制参数

当允许列表条目应匹配某个二进制文件和特定参数形状时，添加 `argPattern`。OpenClaw 会对解析后的命令参数应用该正则表达式，不包括可执行文件令牌
(`argv[0]`)。对于手写条目，参数会用单个空格连接，因此当你需要精确匹配时，请锚定模式。

```json
{
  "version": 1,
  "agents": {
    "main": {
      "allowlist": [
        {
          "pattern": "python3",
          "argPattern": "^safe\\.py$"
        }
      ]
    }
  }
}
```

该条目允许 `python3 safe.py`；`python3 other.py` 会未命中允许列表。如果同一个二进制文件还存在仅路径条目，未匹配的参数仍可以回退到该仅路径条目。当目标是将该二进制文件限制为声明的参数时，请省略仅路径条目。

审批流保存的条目可以使用内部分隔符格式进行精确 argv 匹配。优先使用 UI 或审批流重新生成这些条目，而不是手动编辑编码值。如果 OpenClaw 无法解析某个命令片段的 argv，带有 `argPattern` 的条目不会匹配。

每个允许列表条目支持：

| 字段               | 含义                                                          |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | 已解析的二进制路径 glob 或裸命令名 glob                      |
| `argPattern`       | 可选的 argv 正则表达式；省略的条目仅按路径匹配               |
| `id`               | 用于 UI 标识的稳定 UUID                                      |
| `source`           | 条目来源，例如 `allow-always`                                |
| `commandText`      | 审批流创建条目时捕获的命令文本                              |
| `lastUsedAt`       | 最近使用时间戳                                                |
| `lastUsedCommand`  | 最近匹配的命令                                                |
| `lastResolvedPath` | 最近解析出的二进制路径                                        |

## 自动允许技能 CLI

启用**自动允许技能 CLI** 后，已知 Skills 引用的可执行文件会在节点（macOS 节点或无头节点主机）上被视为已加入允许列表。这会通过 Gateway 网关 RPC 使用 `skills.bins` 获取技能二进制列表。如果你想使用严格的手动允许列表，请禁用此功能。

<Warning>
- 这是一个**隐式便利允许列表**，独立于手动路径允许列表条目。
- 它适用于 Gateway 网关和节点处于同一信任边界内的可信操作员环境。
- 如果你需要严格的显式信任，请保持 `autoAllowSkills: false`，并且只使用手动路径允许列表条目。

</Warning>

## 安全二进制文件和审批转发

关于安全二进制文件（仅 stdin 快速路径）、解释器绑定细节，以及如何将审批提示转发到 Slack/Discord/Telegram（或将它们作为原生审批客户端运行），请参阅
[Exec 审批 - 高级](/zh-CN/tools/exec-approvals-advanced)。

## Control UI 编辑

使用 **Control UI → Nodes → Exec approvals** 卡片来编辑默认值、按智能体覆盖项和允许列表。选择一个作用域（默认值或某个智能体），调整策略，添加/移除允许列表模式，然后点击 **Save**。UI 会按模式显示最近使用的元数据，方便你保持列表整洁。

目标选择器会选择 **Gateway 网关**（本地审批）或某个**节点**。
节点必须公布 `system.execApprovals.get/set`（macOS 应用或无头节点主机）。如果节点尚未公布 Exec 审批，请直接编辑它的本地审批文件。

CLI：`openclaw approvals` 支持编辑 Gateway 网关或节点，参见
[审批 CLI](/zh-CN/cli/approvals)。

## 审批流

当需要提示时，Gateway 网关会向操作员客户端广播
`exec.approval.requested`。Control UI 和 macOS 应用通过 `exec.approval.resolve` 解析它，然后 Gateway 网关将获批请求转发给节点主机。

对于 `host=node`，审批请求包含规范的 `systemRunPlan`
负载。Gateway 网关在转发已批准的 `system.run`
请求时，会将该计划作为权威的命令/cwd/会话上下文。

这对异步审批延迟很重要：

- 节点 Exec 路径会预先准备一个规范计划。
- 审批记录会存储该计划及其绑定元数据。
- 一旦获批，最终转发的 `system.run` 调用会复用已存储的计划，而不是信任之后的调用方编辑。
- 如果调用方在审批请求创建后更改 `command`、`rawCommand`、`cwd`、`agentId` 或 `sessionKey`，Gateway 网关会将转发运行作为审批不匹配而拒绝。

## 系统事件

Exec 生命周期会作为系统消息呈现：

- `Exec running`（仅当命令超过运行通知阈值时）。
- `Exec finished`。

这些消息会在节点报告事件后发布到智能体的会话中。
被拒绝的 Exec 审批对主机命令本身是终止性的：命令不会运行。对于带有来源会话的主智能体异步审批，OpenClaw 会将拒绝作为内部 followup 发回该会话，以便智能体停止等待异步命令并避免缺失结果修复。
如果没有会话或无法恢复会话，OpenClaw 仍可以向操作员或直接聊天路由报告简洁的拒绝。对子智能体会话的拒绝不会发回子智能体。
Gateway 网关主机 Exec 审批会在命令完成时（并可选在运行时间超过阈值时）发出相同的生命周期事件。
受审批保护的 Exec 会在这些消息中复用审批 id 作为 `runId`，便于关联。

## 审批被拒绝时的行为

当异步 Exec 审批被拒绝时，OpenClaw 会将主机命令视为已终止并失败关闭。对于主智能体会话，该拒绝会作为内部会话 followup 传递，告诉智能体异步命令未运行。
这样可以保留转录连续性，而不会暴露过期的命令输出。如果会话传递不可用，OpenClaw 会在存在安全路由时回退为简洁的操作员或直接聊天拒绝。

## 影响

- **`full`** 权限强大；尽可能优先使用允许列表。
- **`ask`** 让你保持在审批环路中，同时仍支持快速审批。
- 按智能体允许列表可防止一个智能体的审批泄漏到其他智能体。
- 审批只适用于来自**已授权发送者**的主机 Exec 请求。未授权发送者不能发出 `/exec`。
- `/exec security=full` 是面向授权操作员的会话级便利功能，并且按设计会跳过审批。要硬性阻止主机 Exec，请将审批安全性设置为 `deny`，或通过工具策略拒绝 `exec` 工具。

## 相关

<CardGroup cols={2}>
  <Card title="Exec approvals - advanced" href="/zh-CN/tools/exec-approvals-advanced" icon="gear">
    安全二进制文件、解释器绑定，以及将审批转发到聊天。
  </Card>
  <Card title="Exec tool" href="/zh-CN/tools/exec" icon="terminal">
    Shell 命令执行工具。
  </Card>
  <Card title="Elevated mode" href="/zh-CN/tools/elevated" icon="shield-exclamation">
    也会跳过审批的紧急旁路路径。
  </Card>
  <Card title="Sandboxing" href="/zh-CN/gateway/sandboxing" icon="box">
    沙箱模式和工作区访问。
  </Card>
  <Card title="Security" href="/zh-CN/gateway/security" icon="lock">
    安全模型和加固。
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    何时使用每种控制方式。
  </Card>
  <Card title="Skills" href="/zh-CN/tools/skills" icon="sparkles">
    由 Skills 支持的自动允许行为。
  </Card>
</CardGroup>
