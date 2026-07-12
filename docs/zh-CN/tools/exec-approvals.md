---
read_when:
    - 配置 Exec 审批或允许列表
    - 在 macOS 应用中实现 Exec 审批用户体验
    - 审查沙箱逃逸提示词及其影响
sidebarTitle: Exec approvals
summary: 主机 Exec 审批：策略选项、允许列表，以及 YOLO/严格工作流
title: Exec 审批
x-i18n:
    generated_at: "2026-07-11T20:59:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b44efdfe5a6c9f3cc978baef91d80d1f75d39627d3a16f5971800809a642a72c
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec 审批是**配套应用 / 节点主机的安全护栏**，用于允许沙箱隔离的智能体在真实主机（`gateway` 或 `node`）上运行命令。只有策略、允许列表和（可选的）用户审批全部同意时，命令才会运行。审批叠加在工具策略和提升权限门控**之上**（提升权限的 `full` 会跳过审批）。

有关 `deny`、`allowlist`、`ask`、`auto`、`full`、Codex Guardian 映射和 ACPX harness 权限的模式优先概览，请参阅[权限模式](/zh-CN/tools/permission-modes)。

<Note>
有效策略取 `tools.exec.*` 与审批默认值中**更严格**的一方：审批只能收紧配置派生的安全性/询问策略，绝不能放宽。如果省略某个审批字段，则使用 `tools.exec` 的值。主机 Exec 还会使用该计算机上的本地审批状态——即使会话或配置默认值要求 `ask: "on-miss"`，执行主机审批文件中主机本地的 `ask: "always"` 仍会持续提示。
</Note>

## 适用范围

Exec 审批在执行主机本地强制实施：

- **Gateway 网关主机** -> Gateway 网关计算机上的 `openclaw` 进程。
- **节点主机** -> 节点运行器（macOS 配套应用或无头节点主机）。

### 信任模型

- 通过 Gateway 网关身份验证的调用方是该 Gateway 网关的受信任操作员。
- 已配对节点将这种受信任操作员能力扩展到节点主机。
- 审批可降低意外执行的风险，但它**不是**按用户划分的身份验证边界，也不是文件系统只读策略。
- 命令获批后，可根据所选主机或沙箱文件系统权限修改文件。
- 获批的节点主机运行会绑定规范执行上下文：cwd、精确 argv、存在时的环境变量绑定，以及适用时固定的可执行文件路径。
- 对于 shell 脚本以及直接调用解释器/运行时文件的情况，OpenClaw 还会尝试绑定一个具体的本地文件操作数。如果该文件在审批后、执行前发生变化，运行将被拒绝，而不会执行已漂移的内容。
- 文件绑定是尽力而为的机制，并不能完整覆盖每种解释器/运行时加载器路径。如果无法识别出恰好一个具体的本地文件，OpenClaw 将拒绝生成由审批支持的运行，而不会假装实现了完整覆盖。

### macOS 职责划分

- **节点主机服务**通过本地 IPC 将 `system.run` 转发到 **macOS 应用**。
- **macOS 应用**强制实施审批，并在 UI 上下文中执行命令。

## 检查有效策略

| 命令                                                             | 显示内容                                               |
| ---------------------------------------------------------------- | ------------------------------------------------------ |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | 请求的策略、主机策略来源以及有效结果。                 |
| `openclaw exec-policy show`                                      | 本地计算机的合并视图。                                 |
| `openclaw exec-policy set` / `preset`                            | 一步将本地请求策略与本地主机审批文件同步。             |

<Note>
其中不包含每会话的 `/exec` 覆盖。请在相关会话中运行 `/exec`，以检查其当前默认值。参阅[会话覆盖](/zh-CN/tools/exec#session-overrides-exec)。
</Note>

完整 CLI 参考（标志、JSON 输出、允许列表添加/删除）：[审批 CLI](/zh-CN/cli/approvals)。

当本地作用域请求 `host=node` 时，`exec-policy show` 会将该作用域报告为运行时由节点管理，而不是将本地审批文件视为事实来源。

如果配套应用 UI **不可用**，任何通常会触发提示的请求都将由**询问回退策略**处理（默认值：`deny`）。

<Tip>
原生聊天审批客户端可以在待处理审批消息中预置渠道特定的便捷操作。Matrix 会预置表情回应快捷方式（`✅` 单次允许、`♾️` 始终允许、`❌` 拒绝），同时仍在消息中保留 `/approve ...` 作为回退方式。
</Tip>

## 设置与存储

审批存储在执行主机上的本地 JSON 文件中。设置 `OPENCLAW_STATE_DIR` 后，该文件位于对应的状态目录中；否则使用默认的 OpenClaw 状态目录：

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# 否则
~/.openclaw/exec-approvals.json
```

默认审批套接字遵循相同的根目录：`$OPENCLAW_STATE_DIR/exec-approvals.sock`；未设置该变量时，则为 `~/.openclaw/exec-approvals.sock`。

2026.6.6 之前的版本始终将该文件保存在 `~/.openclaw` 中。如果 `OPENCLAW_STATE_DIR` 指向其他位置，而默认目录中仍存在审批文件，请直接运行一次 `openclaw doctor --fix`，将其导入状态目录（原文件会以 `.migrated` 后缀归档）。交互式 Doctor 也可以预览并确认导入。自动更新和 Gateway 网关监视修复运行绝不会跨状态目录导入：临时或预发布状态目录不得获取默认安装的审批数据。将旧版 `plugin-binding-approvals.json` 导入共享 SQLite 状态时，同样适用此边界。

示例架构：

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
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## 策略选项

### `tools.exec.mode`

`tools.exec.mode` 是主机 Exec 首选的规范化策略配置面：

| 值          | 行为                                                                                                                                                              |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deny`      | 阻止主机 Exec。                                                                                                                                                   |
| `allowlist` | 仅运行允许列表中的命令，不进行询问。                                                                                                                              |
| `ask`       | 使用允许列表策略，并在未匹配时询问。                                                                                                                              |
| `auto`      | 使用允许列表策略，直接运行确定性匹配项，并将未获批准的项目发送给 OpenClaw 原生自动审查器，然后再回退到人工审批途径。                                                |
| `full`      | 运行主机 Exec，不显示审批提示。                                                                                                                                   |

旧版 `tools.exec.security` / `tools.exec.ask` 仍受支持，并且在相应作用域未设置 `mode` 时继续生效。

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - 阻止所有主机 Exec 请求。
  - `allowlist` - 仅允许允许列表中的命令。
  - `full` - 允许所有内容（等同于提升权限）。

Gateway 网关/节点主机的默认值是 `full`；`sandbox` 主机的默认值则是 `deny`。
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  为主机 Exec 配置的询问策略。控制来自 `tools.exec.ask` 和主机审批默认值的基准审批提示行为。默认值为 `off`。每次调用的 `ask` 工具参数（参阅 [Exec 工具](/zh-CN/tools/exec#parameters)）只能强化该基准策略；当有效的主机询问策略为 `off` 时，源自渠道的模型调用会忽略此参数。

- `off` - 从不提示。
- `on-miss` - 仅在允许列表不匹配时提示。
- `always` - 每条命令都提示。当有效询问模式为 `always` 时，`allow-always` 持久信任**不会**抑制提示。

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  需要提示但无法访问 UI（或提示超时）时的处理方式。省略时默认为 `deny`。

- `deny` - 阻止。
- `allowlist` - 仅在匹配允许列表时允许。
- `full` - 允许。

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  为 `true` 时，即使解释器二进制文件本身在允许列表中，也会将内联代码求值形式视为必须审批。针对无法清晰映射到单个稳定文件操作数的解释器加载器，提供纵深防御。
</ParamField>

严格模式会捕获的示例：`python -c`、`node -e`/`--eval`/`-p`、`ruby -e`、`perl -e`/`-E`、`php -r`、`lua -e`、`osascript -e`（以及 `awk`、`sed`、`make`、`find -exec` 和 `xargs` 的内联形式）。

在严格模式下，这些命令需要审查器或显式审批。使用 `tools.exec.mode: "auto"` 时，如果命令具有可强制执行的计划，审查器可以批准一次低风险执行；否则 OpenClaw 会询问人工审批者。到达审查器回退流程的 `Codex app-server` 命令审批会请求人工审批，因为其审批请求不会公开可强制执行的已解析可执行文件。`allow-always` 不会为内联求值命令持久保存新的允许列表条目。

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  仅影响呈现：启用后，OpenClaw 可以附加由解析器派生的命令范围，使 Web 审批提示能够突出显示命令词元。它**不会**更改 `security`、`ask`、允许列表匹配、严格内联求值行为、审批转发或命令执行。
</ParamField>

可以在全局的 `tools.exec.commandHighlighting` 下设置，也可以在每个智能体的 `agents.list[].tools.exec.commandHighlighting` 下设置。

## YOLO 模式（无需审批）

要在不显示审批提示的情况下运行主机 Exec，需要同时开放**两层**策略：OpenClaw 配置中请求的 Exec 策略（`tools.exec.*`），以及执行主机审批文件中的主机本地审批策略。

省略 `askFallback` 时默认为 `deny`。如果无 UI 时的审批提示应回退为允许，请显式将主机的 `askFallback` 设置为 `full`。

| 层级                  | YOLO 设置                  |
| --------------------- | -------------------------- |
| `tools.exec.security` | 在 `gateway`/`node` 上设为 `full` |
| `tools.exec.ask`      | `off`                      |
| 主机 `askFallback`    | `full`                     |

<Warning>
**重要区别：**

- `tools.exec.host=auto` 选择 Exec **在哪里**运行：有可用沙箱时在沙箱中运行，否则在 Gateway 网关上运行。
- YOLO 选择主机 Exec **如何**获得批准：`security=full` 加 `ask=off`。
- 除已配置的主机 Exec 策略之外，YOLO **不会**额外添加启发式命令混淆审批门控或脚本预检拒绝层。
- `auto` 不会使 Gateway 网关路由成为沙箱隔离会话可随意使用的覆盖项。通过 `auto` 可以发出每次调用的 `host=node` 请求；仅当没有活动的沙箱运行时时，才能通过 `auto` 使用 `host=gateway`。如需稳定的非自动默认值，请设置 `tools.exec.host`，或显式使用 `/exec host=...`。

</Warning>

由 CLI 支持、且提供自身非交互式权限模式的提供商可以遵循此策略。当 OpenClaw 的有效 Exec 策略为 YOLO 时，Claude CLI 会添加 `--permission-mode bypassPermissions`。对于由 OpenClaw 管理的 Claude 实时会话，OpenClaw 的有效 Exec 策略优先于 Claude 的原生权限模式：YOLO 会将实时启动规范化为 `--permission-mode bypassPermissions`，而限制性的有效 Exec 策略会将实时启动规范化为 `--permission-mode default`，即使原始 Claude 后端参数指定了其他模式。

如果你希望使用更保守的设置，请将 OpenClaw Exec 策略收紧回 `allowlist` / `on-miss` 或 `deny`。

### 持久化的 Gateway 网关主机“从不提示”设置

<Steps>
  <Step title="设置所需的配置策略">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="同步主机审批文件">
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

同时更新本地的 `tools.exec.host/security/ask` 和本地审批文件的默认值（包括 `askFallback: "full"`）。此命令有意仅作用于本地。若要远程更改 Gateway 网关主机或节点主机的审批设置，请使用 `openclaw approvals set --gateway` 或 `openclaw approvals set --node
<id|name|ip>`。

其他内置预设包括：`cautious`（`host=gateway`、`security=allowlist`、`ask=on-miss`、`askFallback=deny`）和 `deny-all`（`host=gateway`、`security=deny`、`ask=off`、`askFallback=deny`）。使用相同方式应用：
`openclaw exec-policy preset cautious`。

若要设置个别字段而不是完整预设，请使用
`openclaw exec-policy set --host <auto|sandbox|gateway|node> --security
<deny|allowlist|full> --ask <off|on-miss|always> --ask-fallback
<deny|allowlist|full>`，并可任意组合这些标志。

### 节点主机

改为在节点上应用相同的审批文件：

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
**仅限本地的限制：**

- `openclaw exec-policy` 不会同步节点审批设置。
- `openclaw exec-policy set --host node` 会被拒绝。
- 节点 Exec 审批会在运行时从节点获取，因此面向节点的更新必须使用 `openclaw approvals --node ...`。

</Note>

### 仅限会话的快捷方式

- `/exec security=full ask=off` 仅更改当前会话。
- `/elevated full` 是一个紧急解锁快捷方式，仅当请求的策略和主机审批文件均解析为 `security: "full"` 和 `ask: "off"` 时，才会跳过 Exec 审批。更严格的主机文件（例如 `ask:
"always"`）仍会触发提示。

如果主机审批文件始终比配置更严格，仍以更严格的主机策略为准。

## 允许列表（按智能体）

允许列表是**按智能体配置的**。如果存在多个智能体，请在 macOS 应用中切换当前正在编辑的智能体。模式采用 glob 匹配。

模式可以是解析后的二进制文件路径 glob，也可以是纯命令名称 glob。纯名称仅匹配通过 `PATH` 调用的命令，因此当命令为 `rg` 时，`rg` 可以匹配 `/opt/homebrew/bin/rg`，但**不会**匹配 `./rg` 或 `/tmp/rg`。若只信任特定位置的某个二进制文件，请使用路径 glob。

旧版 `agents.default` 条目会在加载时迁移到 `agents.main`。对于 `echo ok && pwd` 之类的 Shell 命令链，每个顶层命令段仍必须满足允许列表规则。

示例：

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### 使用 argPattern 限制参数

当允许列表条目需要同时匹配二进制文件和特定参数形式时，请添加 `argPattern`。OpenClaw 在所有主机上均使用 ECMAScript（JavaScript）正则表达式语义，并针对解析后的命令参数计算该表达式，但不包括可执行文件标记（`argv[0]`）。对于手动编写的条目，各参数会用单个空格连接，因此需要精确匹配时请为模式添加锚点。

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

该条目允许 `python3 safe.py`；`python3 other.py` 不匹配允许列表。如果还存在同一二进制文件的仅路径条目，未匹配的参数仍可回退到该仅路径条目。如果目标是将该二进制文件限制为仅能使用声明的参数，请省略仅路径条目。

由审批流程保存的条目使用内部分隔符格式进行精确的 argv 匹配。请优先通过 UI 或审批流程重新生成这些条目，而不要手动编辑编码后的值。如果 OpenClaw 无法解析某个命令段的 argv，包含 `argPattern` 的条目不会匹配。

每个允许列表条目支持：

| 字段               | 含义                                                  |
| ------------------ | ---------------------------------------------------- |
| `pattern`          | 解析后的二进制文件路径 glob 或纯命令名称 glob         |
| `argPattern`       | 可选的 ECMAScript argv 正则表达式；省略时仅匹配路径    |
| `id`               | 稳定的不透明 ID；缺失时生成 UUID                      |
| `source`           | 条目来源，例如 `allow-always`                         |
| `commandText`      | 旧版纯文本输入；加载期间丢弃                           |
| `lastUsedAt`       | 上次使用时间戳                                         |
| `lastUsedCommand`  | 上次匹配的命令                                         |
| `lastResolvedPath` | 上次解析出的二进制文件路径                             |

## 自动允许 Skills CLI

启用**自动允许 Skills CLI**（`autoAllowSkills`）后，已知 Skills 引用的可执行文件在节点上（macOS 节点或无头节点主机）会被视为已加入允许列表。此功能通过 Gateway RPC 使用 `skills.bins` 获取 Skills 二进制文件列表。如果你希望使用严格的手动允许列表，请禁用此功能。

<Warning>
- 这是一个**隐式的便利允许列表**，与手动路径允许列表条目相互独立。
- 它适用于 Gateway 网关与节点处于同一信任边界内的可信操作员环境。
- 如果你需要严格的显式信任，请保持 `autoAllowSkills: false`，并且仅使用手动路径允许列表条目。

</Warning>

## 安全二进制文件与审批转发

有关安全二进制文件（仅限标准输入的快速路径）、解释器绑定详情，以及如何将审批提示转发到 Slack、Discord、Telegram（或将它们作为原生审批客户端运行），请参阅
[Exec 审批——高级用法](/zh-CN/tools/exec-approvals-advanced)。

## Control UI 编辑

使用 **Control UI -> 节点 -> Exec 审批** 卡片编辑默认值、按智能体覆盖项和允许列表。选择一个作用域（默认值或某个智能体），调整策略，添加或删除允许列表模式，然后点击**保存**。UI 会显示每个模式的上次使用元数据，方便你保持列表整洁。

目标选择器可选择 **Gateway 网关**（本地审批）或某个**节点**。节点必须公开 `system.execApprovals.get/set`（macOS 应用或无头节点主机）。如果节点尚未公开 Exec 审批，请直接编辑其本地审批文件。

某些节点主机（包括 Windows 配套应用）使用不同的审批策略格式。Control UI 会以只读方式显示这些主机原生策略。请使用配套应用，或通过带原生策略结构的 `openclaw approvals set --node <id|name|ip>` 编辑它们；请参阅[审批 CLI](/zh-CN/cli/approvals)。

CLI：`openclaw approvals` 支持编辑 Gateway 网关或节点，请参阅
[审批 CLI](/zh-CN/cli/approvals)。

## 审批流程

需要提示时，Gateway 网关会向操作员客户端广播 `exec.approval.requested`。Control UI 和 macOS 应用通过 `exec.approval.resolve` 处理请求，随后 Gateway 网关将已批准的请求转发到节点主机。

对于 `host=node`，审批请求包含规范的 `systemRunPlan` 载荷。转发已批准的 `system.run` 请求时，Gateway 网关将该计划作为命令、cwd 和会话上下文的权威来源：

- 节点 Exec 路径会预先准备一个规范计划。
- 审批记录会存储该计划及其绑定元数据。
- 审批通过后，最终转发的 `system.run` 调用会复用已存储的计划，而不是信任调用方之后所做的编辑。
- 如果调用方在创建审批请求后更改 `command`、`rawCommand`、`cwd`、`agentId` 或 `sessionKey`，Gateway 网关会因审批不匹配而拒绝转发此次运行。

## 系统事件与拒绝

节点报告完成后，Exec 生命周期会向智能体的会话发送一条 `Exec finished` 系统消息。审批通过后，OpenClaw 还可以在经过 `tools.exec.approvalRunningNoticeMs` 指定的时间后发送进行中通知（默认值为 `10000`，设为 `0` 可禁用）。被拒绝的 Exec 审批对主机命令而言是终止状态：命令不会运行。

- 对于具有来源会话的主智能体异步审批，OpenClaw 会将拒绝结果作为内部后续消息发送回该会话，使智能体能够停止等待异步命令，并避免执行缺失结果修复。
- 如果没有会话或无法恢复会话，OpenClaw 仍可向操作员或直接聊天路由报告简洁的拒绝信息。
- 子智能体和 cron 会话的拒绝结果不会发送回相应会话。

Gateway 网关主机 Exec 审批会发出相同的完成生命周期事件。受审批约束的 Exec 会复用审批 ID，将待处理请求与其完成或拒绝消息关联起来（`Exec finished (gateway
id=...)` / `Exec denied (gateway id=...)`）。

## 影响

- **`full`** 权限很强；应尽可能优先使用允许列表。
- **`ask`** 让你能够掌握执行情况，同时仍支持快速审批。
- 按智能体配置的允许列表可防止一个智能体的审批泄漏到其他智能体。
- 审批仅适用于来自**已授权发送者**的主机 Exec 请求。未授权发送者无法发出 `/exec`。
- `/exec security=full` 是供已授权操作员使用的会话级便利功能，并且按设计会跳过审批。若要彻底阻止主机 Exec，请将审批安全策略设为 `deny`，或通过工具策略拒绝 `exec` 工具。

## 相关内容

<CardGroup cols={2}>
  <Card title="Exec 审批——高级用法" href="/zh-CN/tools/exec-approvals-advanced" icon="gear">
    安全二进制文件、解释器绑定以及向聊天转发审批。
  </Card>
  <Card title="Exec 工具" href="/zh-CN/tools/exec" icon="terminal">
    Shell 命令执行工具。
  </Card>
  <Card title="提升权限模式" href="/zh-CN/tools/elevated" icon="shield-exclamation">
    同样会跳过审批的紧急解锁路径。
  </Card>
  <Card title="沙箱隔离" href="/zh-CN/gateway/sandboxing" icon="box">
    沙箱模式和工作区访问。
  </Card>
  <Card title="安全性" href="/zh-CN/gateway/security" icon="lock">
    安全模型与加固。
  </Card>
  <Card title="沙箱、工具策略和提升权限" href="/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    各项控制措施的适用场景。
  </Card>
  <Card title="Skills" href="/zh-CN/tools/skills" icon="sparkles">
    由 Skills 支持的自动允许行为。
  </Card>
</CardGroup>
