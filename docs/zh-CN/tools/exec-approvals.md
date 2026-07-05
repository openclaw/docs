---
read_when:
    - 配置 Exec 审批或允许列表
    - 在 macOS 应用中实现 Exec 审批 UX
    - 审查沙箱逃逸提示及其影响
sidebarTitle: Exec approvals
summary: 主机 Exec 审批：策略开关、允许列表和 YOLO/严格工作流
title: Exec 审批
x-i18n:
    generated_at: "2026-07-05T11:46:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ddbd4dc2229183fe5a9b12c5fe26e89c09f0259d9c929d37e1c3b85311123a2
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec 审批是**配套应用 / 节点主机护栏**，用于允许沙箱隔离的智能体在真实主机（`gateway` 或 `node`）上运行命令。只有当策略 + 允许列表 +（可选）用户审批全部一致时，命令才会运行。审批叠加在工具策略和提升权限门控**之上**（提升权限的 `full` 会跳过它们）。

如需按模式优先了解 `deny`、`allowlist`、`ask`、`auto`、`full`、Codex Guardian 映射以及 ACPX harness 权限，请参阅[权限模式](/zh-CN/tools/permission-modes)。

<Note>
有效策略是 `tools.exec.*` 与审批默认值中**更严格**的那个：审批只能收紧从配置派生的安全性 / 询问策略，永远不能放宽。如果省略某个审批字段，则使用 `tools.exec` 值。主机 Exec 还会使用该机器上的本地审批状态 - 如果执行主机审批文件中存在主机本地的 `ask: "always"`，即使会话或配置默认值请求 `ask: "on-miss"`，它也会继续提示。
</Note>

## 适用位置

Exec 审批在执行主机本地强制执行：

- **Gateway 网关主机** -> Gateway 网关机器上的 `openclaw` 进程。
- **节点主机** -> 节点运行器（macOS 配套应用或无头节点主机）。

### 信任模型

- 通过 Gateway 网关认证的调用方，是该 Gateway 网关的可信操作员。
- 已配对的节点会将该可信操作员能力扩展到节点主机。
- 审批会降低意外执行风险，但**不是**每用户认证边界或文件系统只读策略。
- 一旦获批，命令可以根据所选主机或沙箱文件系统权限修改文件。
- 已获批的节点主机运行会绑定规范执行上下文：cwd、精确 argv、存在时的 env 绑定，以及适用时固定的可执行文件路径。
- 对于 shell 脚本和直接解释器 / 运行时文件调用，OpenClaw 还会尝试绑定一个具体的本地文件操作数。如果该文件在审批之后、执行之前发生变化，运行会被拒绝，而不是执行已漂移的内容。
- 文件绑定是尽力而为的，不是每个解释器 / 运行时加载器路径的完整模型。如果无法识别恰好一个具体的本地文件，OpenClaw 会拒绝生成由审批背书的运行，而不是假装具备完整覆盖。

### macOS 分离架构

- **节点主机服务**通过 local IPC 将 `system.run` 转发给 **macOS 应用**。
- **macOS 应用**强制执行审批，并在 UI 上下文中执行命令。

## 检查有效策略

| 命令                                                             | 显示内容                                                                               |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | 请求的策略、主机策略来源和有效结果。                                                   |
| `openclaw exec-policy show`                                      | 本地机器的合并视图。                                                                   |
| `openclaw exec-policy set` / `preset`                            | 一步同步本地请求策略与本地主机审批文件。                                               |

完整 CLI 参考（标志、JSON 输出、允许列表添加 / 移除）：[Approvals CLI](/zh-CN/cli/approvals)。

当本地范围请求 `host=node` 时，`exec-policy show` 会报告该范围在运行时由节点管理，而不是把本地审批文件视为事实来源。

如果配套应用 UI **不可用**，任何通常会提示的请求都会由 **ask 回退**处理（默认：`deny`）。

<Tip>
原生聊天审批客户端可以在待处理审批消息上播种渠道特定的便捷操作。Matrix 会播种表情回应快捷方式（`✅` 允许一次、`♾️` 始终允许、`❌` 拒绝），同时仍在消息中保留 `/approve ...` 作为回退。
</Tip>

## 设置和存储

审批存放在执行主机上的本地 JSON 文件中。设置 `OPENCLAW_STATE_DIR` 时，该文件会跟随该状态目录；否则使用默认 OpenClaw 状态目录：

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# otherwise
~/.openclaw/exec-approvals.json
```

默认审批套接字使用相同根目录：
`$OPENCLAW_STATE_DIR/exec-approvals.sock`，或在未设置该变量时使用
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

`tools.exec.mode` 是主机 Exec 首选的规范化策略表面：

| 值          | 行为                                                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deny`      | 阻止主机 Exec。                                                                                                                                                           |
| `allowlist` | 仅运行允许列表中的命令，不询问。                                                                                                                                          |
| `ask`       | 使用允许列表策略，并在未命中时询问。                                                                                                                                      |
| `auto`      | 使用允许列表策略，直接运行确定性匹配项，并在回退到人工审批路径之前，将审批未命中项发送给 OpenClaw 的原生自动审阅器。                                                     |
| `full`      | 运行主机 Exec，不显示审批提示。                                                                                                                                           |

旧版 `tools.exec.security` / `tools.exec.ask` 仍受支持，并且仍会在该范围未设置 `mode` 的任何位置应用。

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - 阻止所有主机 Exec 请求。
  - `allowlist` - 仅允许允许列表中的命令。
  - `full` - 允许一切（等同于提升权限）。

Gateway 网关 / 节点主机默认值为 `full`；`sandbox` 主机则默认使用
`deny`。
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  为主机 Exec 配置的询问策略。控制来自 `tools.exec.ask` 和主机审批默认值的基线审批提示行为。默认值为 `off`。每次调用的 `ask` 工具参数（参见 [Exec 工具](/zh-CN/tools/exec#parameters)）只能强化该基线，并且当有效主机询问策略为 `off` 时，来自渠道的模型调用会忽略它。

- `off` - 从不提示。
- `on-miss` - 仅在允许列表未匹配时提示。
- `always` - 每条命令都提示。当有效询问模式为 `always` 时，`allow-always` 持久信任**不会**抑制提示。

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  需要提示但没有可达 UI（或提示超时）时的解决方式。省略时默认值为 `deny`。

- `deny` - 阻止。
- `allowlist` - 仅在允许列表匹配时允许。
- `full` - 允许。

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  当为 `true` 时，即使解释器二进制本身在允许列表中，也会将内联代码求值形式视为仅能通过审批运行。对于无法清晰映射到一个稳定文件操作数的解释器加载器，这是一种纵深防御。
</ParamField>

严格模式会捕获的示例：`python -c`、`node -e`/`--eval`/`-p`、`ruby -e`、`perl -e`/`-E`、`php -r`、`lua -e`、`osascript -e`（以及 `awk`、`sed`、`make`、`find -exec` 和 `xargs` 内联形式）。

在严格模式下，这些命令仍需要显式审批，并且 `allow-always` 不会自动为它们持久化新的允许列表条目。

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  仅用于呈现：启用后，OpenClaw 可以附加由解析器派生的命令范围，以便 Web 审批提示高亮命令 token。它**不会**改变 `security`、`ask`、允许列表匹配、严格内联求值行为、审批转发或命令执行。
</ParamField>

可在 `tools.exec.commandHighlighting` 下全局设置，或在
`agents.list[].tools.exec.commandHighlighting` 下按智能体设置。

## YOLO 模式（无审批）

若要运行主机 Exec 而不显示审批提示，请同时打开**两层**策略：OpenClaw 配置中的请求 Exec 策略（`tools.exec.*`）**以及**执行主机审批文件中的主机本地审批策略。

省略的 `askFallback` 默认值为 `deny`。当无 UI 审批提示应回退为允许时，请显式将主机 `askFallback` 设置为 `full`。

| 层                    | YOLO 设置                  |
| --------------------- | -------------------------- |
| `tools.exec.security` | `gateway`/`node` 上为 `full` |
| `tools.exec.ask`      | `off`                      |
| 主机 `askFallback`    | `full`                     |

<Warning>
**重要区别：**

- `tools.exec.host=auto` 选择 Exec **在哪里**运行：有沙箱时在沙箱中运行，否则在 Gateway 网关中运行。
- YOLO 选择主机 Exec **如何**获批：`security=full` 加 `ask=off`。
- YOLO **不会**在已配置的主机 Exec 策略之上增加单独的启发式命令混淆审批门控或脚本预检拒绝层。
- `auto` 不会让 Gateway 网关路由成为沙箱隔离会话中的自由覆盖项。来自 `auto` 的每次调用 `host=node` 请求是允许的；只有在没有活动沙箱运行时时，来自 `auto` 的 `host=gateway` 才允许。若需要稳定的非自动默认值，请设置 `tools.exec.host`，或显式使用 `/exec host=...`。

</Warning>

暴露自身非交互式权限模式的 CLI 后端提供商可以遵循此策略。当 OpenClaw 的有效 Exec 策略为 YOLO 时，Claude CLI 会添加
`--permission-mode bypassPermissions`。对于 OpenClaw 管理的 Claude 实时会话，OpenClaw 的有效 Exec 策略优先于 Claude 的原生权限模式：YOLO 会将实时启动规范化为 `--permission-mode bypassPermissions`，而限制性的有效 Exec 策略会将实时启动规范化为 `--permission-mode default`，即使原始 Claude 后端参数指定了另一种模式。

如果你想要更保守的设置，请将 OpenClaw Exec 策略收紧回
`allowlist` / `on-miss` 或 `deny`。

### 持久 Gateway 网关主机“永不提示”设置

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

同时更新本地 `tools.exec.host/security/ask` 和本地审批
文件默认值（包括 `askFallback: "full"`）。这有意
仅限本地。若要远程更改 gateway-host 或 node-host 审批，请使用
`openclaw approvals set --gateway` 或 `openclaw approvals set --node
<id|name|ip>`。

其他内置预设：`cautious`（`host=gateway`、`security=allowlist`、
`ask=on-miss`、`askFallback=deny`）和 `deny-all`（`host=gateway`、
`security=deny`、`ask=off`、`askFallback=deny`）。用相同方式应用：
`openclaw exec-policy preset cautious`。

若要设置单个字段而不是完整预设，请使用
`openclaw exec-policy set --host <auto|sandbox|gateway|node> --security
<deny|allowlist|full> --ask <off|on-miss|always> --ask-fallback
<deny|allowlist|full>`，并带上这些标志的任意子集。

### Node 主机

改为在节点上应用同一个审批文件：

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
- 节点 Exec 审批会在运行时从节点获取，因此面向节点的更新必须使用 `openclaw approvals --node ...`。

</Note>

### 仅会话快捷方式

- `/exec security=full ask=off` 只更改当前会话。
- `/elevated full` 是一个 break-glass 快捷方式，仅当请求的策略和主机审批文件都解析为
  `security: "full"` 和 `ask: "off"` 时才跳过 Exec 审批。更严格的主机文件，例如 `ask:
"always"`，仍会提示。

如果主机审批文件比配置更严格，则更严格的主机
策略仍然优先。

## 允许列表（按智能体）

允许列表是**按智能体**配置的。如果存在多个智能体，请在 macOS 应用中切换正在编辑的智能体。模式是 glob 匹配。

模式可以是解析后的二进制路径 glob，也可以是裸命令名 glob。
裸名称只匹配通过 `PATH` 调用的命令，因此当命令是 `rg` 时，`rg` 可以匹配
`/opt/homebrew/bin/rg`，但**不能**匹配 `./rg` 或
`/tmp/rg`。使用路径 glob 来信任某一个特定的二进制位置。

旧版 `agents.default` 条目会在加载时迁移到 `agents.main`。
诸如 `echo ok && pwd` 这样的 Shell 链仍需要每个顶层片段
都满足允许列表规则。

示例：

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### 使用 argPattern 限制参数

当允许列表条目应匹配某个二进制文件和某种
特定参数形态时，添加 `argPattern`。OpenClaw 会针对
解析后的命令参数评估正则表达式，不包含可执行文件令牌（`argv[0]`）。
对于手写条目，参数会用单个空格连接，因此
在需要精确匹配时请锚定模式。

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

该条目允许 `python3 safe.py`；`python3 other.py` 是一次允许列表
未命中。如果同一二进制文件还存在仅路径条目，未匹配的
参数仍可回退到该仅路径条目。当目标是将该二进制文件限制为声明的参数时，请省略仅路径
条目。

审批流程保存的条目会使用内部分隔符格式进行精确
argv 匹配。优先使用 UI 或审批流程重新生成这些条目，
而不是手动编辑编码值。如果 OpenClaw 无法解析某个命令片段的 argv，
带有 `argPattern` 的条目不会匹配。

每个允许列表条目支持：

| 字段               | 含义                                      |
| ------------------ | ----------------------------------------- |
| `pattern`          | 解析后的二进制路径 glob 或裸命令名 glob   |
| `argPattern`       | 可选 argv 正则；省略的条目仅按路径匹配    |
| `id`               | 用于 UI 标识的稳定 UUID                   |
| `source`           | 条目来源，例如 `allow-always`             |
| `commandText`      | 审批流程创建条目时捕获的命令文本          |
| `lastUsedAt`       | 上次使用时间戳                            |
| `lastUsedCommand`  | 上次匹配的命令                            |
| `lastResolvedPath` | 上次解析到的二进制路径                    |

## 自动允许 Skills CLI

启用 **自动允许 Skills CLI**（`autoAllowSkills`）后，已知技能引用的可执行文件
会在节点（macOS 节点或无头节点主机）上视为已加入允许列表。这会通过 Gateway 网关 RPC 使用 `skills.bins`
获取技能二进制列表。如果你想要严格的手动
允许列表，请禁用它。

<Warning>
- 这是一个**隐式便捷允许列表**，独立于手动路径允许列表条目。
- 它适用于 Gateway 网关 和节点处于同一信任边界的可信操作员环境。
- 如果你需要严格的显式信任，请保持 `autoAllowSkills: false`，并且只使用手动路径允许列表条目。

</Warning>

## 安全二进制和审批转发

关于安全二进制（仅 stdin 快速路径）、解释器绑定细节，以及
如何将审批提示转发到 Slack/Discord/Telegram（或作为
原生审批客户端运行），请参阅
[Exec 审批 - 高级](/zh-CN/tools/exec-approvals-advanced)。

## Control UI 编辑

使用 **Control UI -> Nodes -> Exec approvals** 卡片来编辑默认值、
按智能体覆盖项和允许列表。选择一个范围（默认值或某个智能体），
调整策略，添加/移除允许列表模式，然后点击 **Save**。UI
会按模式显示上次使用的元数据，便于你保持列表整洁。

目标选择器选择 **Gateway**（本地审批）或一个 **Node**。
节点必须声明 `system.execApprovals.get/set`（macOS 应用或无头
节点主机）。如果某个节点尚未声明 Exec 审批，请直接编辑它的
本地审批文件。

CLI：`openclaw approvals` 支持 Gateway 网关或节点编辑 - 请参阅
[Approvals CLI](/zh-CN/cli/approvals)。

## 审批流程

当需要提示时，Gateway 网关会向操作员客户端广播
`exec.approval.requested`。Control UI 和 macOS
应用通过 `exec.approval.resolve` 解析它，然后 Gateway 网关将
已批准的请求转发给节点主机。

对于 `host=node`，审批请求包含规范的 `systemRunPlan`
载荷。Gateway 网关在转发已批准的 `system.run` 请求时，将该计划作为权威的 command/cwd/session
上下文：

- 节点 Exec 路径会预先准备一个规范计划。
- 审批记录会存储该计划及其绑定元数据。
- 一旦批准，最终转发的 `system.run` 调用会复用已存储的计划，而不是信任后续调用方编辑。
- 如果调用方在审批请求创建后更改 `command`、`rawCommand`、`cwd`、`agentId` 或 `sessionKey`，Gateway 网关会因审批不匹配而拒绝转发的运行。

## 系统事件和拒绝

Exec 生命周期会在节点报告完成后，向智能体的
会话发布一条 `Exec finished` 系统消息。OpenClaw 也可以在
审批获准后、`tools.exec.approvalRunningNoticeMs` 经过后发出
进行中通知（默认 `10000`，`0` 会禁用
它）。被拒绝的 Exec 审批对主机命令是终止性的：该命令
不会运行。

- 对于带有来源会话的主智能体异步审批，OpenClaw
  会将拒绝作为内部 followup 发回该会话，以便
  智能体停止等待异步命令并避免缺失结果
  修复。
- 如果没有会话或无法恢复会话，OpenClaw 仍可
  向操作员或直接聊天路由报告简洁的拒绝。
- 子智能体和 cron 会话的拒绝不会发回该
  会话。

Gateway 主机 Exec 审批会发出相同的完成生命周期事件。
受审批保护的 Exec 会复用审批 ID，将待处理
请求与其完成/拒绝消息关联起来（`Exec finished (gateway
id=...)` / `Exec denied (gateway id=...)`）。

## 影响

- **`full`** 权限很强；尽可能优先使用允许列表。
- **`ask`** 让你保留参与，同时仍允许快速审批。
- 按智能体配置的允许列表可防止一个智能体的审批泄露到其他智能体。
- 审批只适用于来自**已授权发送方**的主机 Exec 请求。未授权发送方无法发出 `/exec`。
- `/exec security=full` 是面向已授权操作员的会话级便捷功能，并且按设计会跳过审批。若要硬性阻止主机 Exec，请将审批安全性设为 `deny`，或通过工具策略拒绝 `exec` 工具。

## 相关

<CardGroup cols={2}>
  <Card title="Exec approvals - advanced" href="/zh-CN/tools/exec-approvals-advanced" icon="gear">
    安全二进制、解释器绑定，以及将审批转发到聊天。
  </Card>
  <Card title="Exec tool" href="/zh-CN/tools/exec" icon="terminal">
    Shell 命令执行工具。
  </Card>
  <Card title="Elevated mode" href="/zh-CN/tools/elevated" icon="shield-exclamation">
    也会跳过审批的 break-glass 路径。
  </Card>
  <Card title="Sandboxing" href="/zh-CN/gateway/sandboxing" icon="box">
    沙箱模式和工作区访问。
  </Card>
  <Card title="Security" href="/zh-CN/gateway/security" icon="lock">
    安全模型和加固。
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    何时使用每种控制。
  </Card>
  <Card title="Skills" href="/zh-CN/tools/skills" icon="sparkles">
    由 Skills 支持的自动允许行为。
  </Card>
</CardGroup>
