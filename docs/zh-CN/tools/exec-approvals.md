---
read_when:
    - 配置 Exec 审批或允许列表
    - 在 macOS 应用中实现 Exec 审批用户体验
    - 审查沙箱逃逸提示词及其影响
sidebarTitle: Exec approvals
summary: 主机 Exec 审批：策略选项、允许列表，以及 YOLO/严格工作流
title: Exec 审批
x-i18n:
    generated_at: "2026-07-12T14:48:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b44efdfe5a6c9f3cc978baef91d80d1f75d39627d3a16f5971800809a642a72c
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec 审批是**配套应用 / 节点主机的防护机制**，用于允许沙箱隔离的智能体在真实主机（`gateway` 或 `node`）上运行命令。只有当策略、允许列表和（可选的）用户审批全部同意时，命令才会运行。审批叠加在工具策略和提升权限门控**之上**（提升权限的 `full` 会跳过审批）。

有关 `deny`、`allowlist`、`ask`、`auto`、`full`、Codex Guardian 映射和 ACPX harness 权限的模式优先概览，请参阅[权限模式](/zh-CN/tools/permission-modes)。

<Note>
有效策略取 `tools.exec.*` 与审批默认值中**更严格**的一方：审批只能收紧配置派生的安全策略/询问策略，绝不能放宽它们。如果省略某个审批字段，则使用 `tools.exec` 的值。主机 Exec 还会使用该机器上的本地审批状态——即使会话或配置默认值请求 `ask: "on-miss"`，执行主机审批文件中主机本地的 `ask: "always"` 仍会持续提示。
</Note>

## 适用范围

Exec 审批在执行主机上本地强制执行：

- **Gateway 网关主机** -> Gateway 网关机器上的 `openclaw` 进程。
- **节点主机** -> 节点运行器（macOS 配套应用或无头节点主机）。

### 信任模型

- 经 Gateway 网关身份验证的调用方是该 Gateway 网关的可信操作员。
- 已配对的节点会将这种可信操作员能力扩展到节点主机。
- 审批可降低意外执行的风险，但它**不是**按用户划分的身份验证边界，也不是文件系统只读策略。
- 命令获批后，可以根据所选主机或沙箱的文件系统权限修改文件。
- 获批的节点主机运行会绑定规范执行上下文：cwd、确切的 argv、存在时的环境变量绑定，以及适用时固定的可执行文件路径。
- 对于 shell 脚本以及直接由解释器/运行时调用的文件，OpenClaw 还会尝试绑定一个具体的本地文件操作数。如果该文件在获批后、执行前发生变化，运行将被拒绝，而不会执行已漂移的内容。
- 文件绑定是尽力而为的机制，并不能完整涵盖每个解释器/运行时加载器路径。如果无法确定唯一一个具体的本地文件，OpenClaw 将拒绝生成由审批支持的运行，而不会假装已经完全覆盖。

### macOS 分工

- **节点主机服务**通过本地 IPC 将 `system.run` 转发给 **macOS 应用**。
- **macOS 应用**强制执行审批，并在 UI 上下文中执行命令。

## 检查有效策略

| 命令                                                             | 显示内容                                                             |
| ---------------------------------------------------------------- | -------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | 请求的策略、主机策略来源和有效结果。                                 |
| `openclaw exec-policy show`                                      | 本地机器的合并视图。                                                 |
| `openclaw exec-policy set` / `preset`                            | 一步将本地请求的策略与本地主机审批文件同步。                         |

<Note>
不包括按会话设置的 `/exec` 覆盖项。请在相关会话中运行 `/exec`，检查其当前默认值。参阅[会话覆盖项](/zh-CN/tools/exec#session-overrides-exec)。
</Note>

完整 CLI 参考（标志、JSON 输出、允许列表添加/删除）：[审批 CLI](/zh-CN/cli/approvals)。

当本地作用域请求 `host=node` 时，`exec-policy show` 会将该作用域报告为运行时由节点管理，而不是将本地审批文件视为事实来源。

如果配套应用 UI **不可用**，任何通常会触发提示的请求都会通过**询问回退策略**处理（默认：`deny`）。

<Tip>
原生聊天审批客户端可以在待处理审批消息中预置渠道专属的便捷操作。Matrix 会预置表情快捷方式（`✅` 仅允许一次、`♾️` 始终允许、`❌` 拒绝），同时仍在消息中保留 `/approve ...` 作为回退方式。
</Tip>

## 设置和存储

审批信息存储在执行主机上的本地 JSON 文件中。设置 `OPENCLAW_STATE_DIR` 时，该文件位于相应状态目录中；否则使用默认的 OpenClaw 状态目录：

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# 否则
~/.openclaw/exec-approvals.json
```

默认审批套接字使用相同的根目录：`$OPENCLAW_STATE_DIR/exec-approvals.sock`；未设置该变量时则为 `~/.openclaw/exec-approvals.sock`。

2026.6.6 之前的版本始终将该文件保存在 `~/.openclaw` 中。如果 `OPENCLAW_STATE_DIR` 指向其他位置，并且默认目录中仍存在审批文件，请直接运行一次 `openclaw doctor --fix`，将其导入状态目录（原始文件会以 `.migrated` 后缀归档）。交互式 Doctor 也可以预览并确认导入。自动更新和 Gateway 网关监视修复运行绝不会跨状态目录导入：临时或预发布状态目录不得获取默认安装中的审批信息。将旧版 `plugin-binding-approvals.json` 导入共享 SQLite 状态时，也适用相同边界。

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

| 值          | 行为                                                                                                                                                                               |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deny`      | 阻止主机 Exec。                                                                                                                                                                    |
| `allowlist` | 仅运行允许列表中的命令，不询问。                                                                                                                                                   |
| `ask`       | 使用允许列表策略，并在未匹配时询问。                                                                                                                                               |
| `auto`      | 使用允许列表策略，直接运行确定性匹配项，并将未获批准的请求发送给 OpenClaw 的原生自动审核器，然后再回退到人工审批路径。                                                             |
| `full`      | 运行主机 Exec，不显示审批提示。                                                                                                                                                    |

旧版 `tools.exec.security` / `tools.exec.ask` 仍受支持，并且在相应作用域未设置 `mode` 时继续生效。

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - 阻止所有主机 Exec 请求。
  - `allowlist` - 仅允许允许列表中的命令。
  - `full` - 允许一切操作（等同于提升权限）。

Gateway 网关/节点主机的默认值为 `full`；`sandbox` 主机的默认值则为 `deny`。
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  为主机 Exec 配置的询问策略。控制来自 `tools.exec.ask` 和主机审批默认值的基准审批提示行为。默认值为 `off`。每次调用的 `ask` 工具参数（参阅 [Exec 工具](/zh-CN/tools/exec#parameters)）只能收紧该基准策略；当有效的主机询问策略为 `off` 时，源自渠道的模型调用会忽略该参数。

- `off` - 从不提示。
- `on-miss` - 仅在允许列表未匹配时提示。
- `always` - 每个命令都提示。当有效询问模式为 `always` 时，`allow-always` 的持久信任**不会**禁止提示。

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  需要提示但无法访问 UI（或提示超时）时的处理方式。省略时默认为 `deny`。

- `deny` - 阻止。
- `allowlist` - 仅在允许列表匹配时允许。
- `full` - 允许。

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  设为 `true` 时，即使解释器二进制文件本身位于允许列表中，也会将内联代码求值形式视为仅能通过审批运行。对于无法明确映射到单一稳定文件操作数的解释器加载器，这可提供纵深防御。
</ParamField>

严格模式会捕获的示例：`python -c`、`node -e`/`--eval`/`-p`、`ruby -e`、`perl -e`/`-E`、`php -r`、`lua -e`、`osascript -e`（以及 `awk`、`sed`、`make`、`find -exec` 和 `xargs` 的内联形式）。

在严格模式下，这些命令需要审核器或明确审批。使用 `tools.exec.mode: "auto"` 时，如果命令具有可强制执行的计划，审核器可以批准一次低风险执行；否则 OpenClaw 会请求人工审批。进入审核器回退流程的 `Codex app-server` 命令审批会请求人工审批，因为其审批请求不会公开可强制执行的已解析可执行文件。对于内联求值命令，`allow-always` 不会持久化新的允许列表条目。

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  仅影响呈现：启用后，OpenClaw 可以附加由解析器派生的命令范围，以便 Web 审批提示突出显示命令词元。它**不会**更改 `security`、`ask`、允许列表匹配、严格内联求值行为、审批转发或命令执行。
</ParamField>

可在全局的 `tools.exec.commandHighlighting` 下设置，也可按智能体在 `agents.list[].tools.exec.commandHighlighting` 下设置。

## YOLO 模式（无需审批）

要运行主机 Exec 而不显示审批提示，需要同时开放**两个**策略层：OpenClaw 配置中请求的 Exec 策略（`tools.exec.*`），以及执行主机审批文件中的主机本地审批策略。

省略 `askFallback` 时默认为 `deny`。如果无 UI 的审批提示应回退为允许，请将主机的 `askFallback` 显式设为 `full`。

| 层                    | YOLO 设置                    |
| --------------------- | ---------------------------- |
| `tools.exec.security` | 在 `gateway`/`node` 上为 `full` |
| `tools.exec.ask`      | `off`                        |
| 主机 `askFallback`    | `full`                       |

<Warning>
**重要区别：**

- `tools.exec.host=auto` 选择 Exec 在**何处**运行：有沙箱时在沙箱中运行，否则在 Gateway 网关上运行。
- YOLO 选择主机 Exec **如何**获得批准：`security=full` 加上 `ask=off`。
- YOLO **不会**在已配置的主机 Exec 策略之上额外添加基于启发式规则的命令混淆审批门控或脚本预检拒绝层。
- `auto` 不会让 Gateway 网关路由成为沙箱隔离会话中的自由覆盖项。使用 `auto` 时，允许每次调用请求 `host=node`；仅当没有活动的沙箱运行时时，`auto` 才允许 `host=gateway`。如需稳定的非自动默认值，请设置 `tools.exec.host` 或显式使用 `/exec host=...`。

</Warning>

CLI 支持的提供商如果暴露了自己的非交互式权限模式，也可以遵循此策略。当 OpenClaw 的有效 Exec 策略为 YOLO 时，Claude CLI 会添加 `--permission-mode bypassPermissions`。对于由 OpenClaw 管理的 Claude 实时会话，OpenClaw 的有效 Exec 策略优先于 Claude 的原生权限模式：YOLO 会将实时启动规范化为 `--permission-mode bypassPermissions`，而限制性的有效 Exec 策略会将实时启动规范化为 `--permission-mode default`，即使原始 Claude 后端参数指定了其他模式也是如此。

如果你希望使用更保守的设置，请将 OpenClaw Exec 策略收紧回 `allowlist` / `on-miss` 或 `deny`。

### 持久化的 Gateway 网关主机“永不提示”设置

<Steps>
  <Step title="设置请求的配置策略">
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

同时更新本地 `tools.exec.host/security/ask` 和本地审批文件的默认值（包括 `askFallback: "full"`）。此操作特意仅限本地。要远程更改 Gateway 网关主机或节点主机的审批，请使用 `openclaw approvals set --gateway` 或 `openclaw approvals set --node
<id|name|ip>`。

其他内置预设：`cautious`（`host=gateway`、`security=allowlist`、`ask=on-miss`、`askFallback=deny`）和 `deny-all`（`host=gateway`、`security=deny`、`ask=off`、`askFallback=deny`）。应用方式相同：`openclaw exec-policy preset cautious`。

要设置单个字段而不是完整预设，请使用
`openclaw exec-policy set --host <auto|sandbox|gateway|node> --security
<deny|allowlist|full> --ask <off|on-miss|always> --ask-fallback
<deny|allowlist|full>`，并可选择其中任意一部分标志。

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

- `openclaw exec-policy` 不会同步节点审批。
- `openclaw exec-policy set --host node` 会被拒绝。
- 节点 Exec 审批会在运行时从节点获取，因此针对节点的更新必须使用 `openclaw approvals --node ...`。

</Note>

### 仅当前会话的快捷方式

- `/exec security=full ask=off` 仅更改当前会话。
- `/elevated full` 是一个紧急突破快捷方式，仅当请求的策略和主机审批文件都解析为 `security: "full"` 和 `ask: "off"` 时才会跳过 Exec 审批。更严格的主机文件（例如 `ask:
"always"`）仍会发出提示。

如果主机审批文件仍比配置更严格，则更严格的主机策略仍然优先。

## 允许列表（按智能体）

允许列表是**按智能体**设置的。如果存在多个智能体，请在 macOS 应用中切换当前编辑的智能体。模式使用 glob 匹配。

模式可以是解析后的二进制文件路径 glob，也可以是裸命令名称 glob。裸名称仅匹配通过 `PATH` 调用的命令，因此当命令为 `rg` 时，`rg` 可以匹配 `/opt/homebrew/bin/rg`，但**不能**匹配 `./rg` 或 `/tmp/rg`。请使用路径 glob 来信任某个特定位置的二进制文件。

旧版 `agents.default` 条目会在加载时迁移到 `agents.main`。对于 `echo ok && pwd` 这类 shell 命令链，每个顶层命令段仍须满足允许列表规则。

示例：

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### 使用 argPattern 限制参数

当允许列表条目应同时匹配某个二进制文件和特定参数形式时，请添加 `argPattern`。OpenClaw 在所有主机上使用 ECMAScript（JavaScript）正则表达式语义，并针对解析后的命令参数计算表达式，不包括可执行文件令牌（`argv[0]`）。对于手动编写的条目，参数使用单个空格连接，因此需要精确匹配时请为模式添加锚点。

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

该条目允许 `python3 safe.py`；`python3 other.py` 未命中允许列表。如果还存在同一二进制文件的纯路径条目，不匹配的参数仍可回退到该纯路径条目。如果目标是将该二进制文件限制为只能使用声明的参数，请省略纯路径条目。

通过审批流程保存的条目会使用内部分隔符格式来精确匹配 argv。请优先通过 UI 或审批流程重新生成这些条目，而不是手动编辑编码后的值。如果 OpenClaw 无法解析某个命令段的 argv，带有 `argPattern` 的条目将不会匹配。

每个允许列表条目支持：

| 字段               | 含义                                                   |
| ------------------ | ------------------------------------------------------ |
| `pattern`          | 解析后的二进制文件路径 glob 或裸命令名称 glob          |
| `argPattern`       | 可选的 ECMAScript argv 正则表达式；省略时仅匹配路径     |
| `id`               | 稳定的不透明 ID；缺失时生成为 UUID                     |
| `source`           | 条目来源，例如 `allow-always`                          |
| `commandText`      | 旧版纯文本输入；加载期间会被丢弃                       |
| `lastUsedAt`       | 上次使用的时间戳                                       |
| `lastUsedCommand`  | 上次匹配的命令                                         |
| `lastResolvedPath` | 上次解析出的二进制文件路径                             |

## 自动允许 Skills CLI

启用 **Auto-allow skill CLIs**（`autoAllowSkills`）后，已知 Skills 引用的可执行文件会在节点（macOS 节点或无界面节点主机）上被视为已加入允许列表。此功能通过 Gateway RPC 使用 `skills.bins` 获取 Skills 二进制文件列表。如果你需要严格的手动允许列表，请禁用此功能。

<Warning>
- 这是一个**隐式的便利性允许列表**，与手动路径允许列表条目分开。
- 它适用于 Gateway 网关和节点处于同一信任边界内的可信操作员环境。
- 如果你要求严格的显式信任，请保持 `autoAllowSkills: false`，并且仅使用手动路径允许列表条目。

</Warning>

## 安全二进制文件和审批转发

有关安全二进制文件（仅限 stdin 的快速路径）、解释器绑定详情，以及如何将审批提示转发到 Slack/Discord/Telegram（或将它们作为原生审批客户端运行），请参阅
[Exec 审批 - 高级用法](/zh-CN/tools/exec-approvals-advanced)。

## Control UI 编辑

使用 **Control UI -> Nodes -> Exec approvals** 卡片编辑默认值、按智能体覆盖项和允许列表。选择一个范围（Defaults 或某个智能体），调整策略，添加或移除允许列表模式，然后点击 **Save**。UI 会显示每个模式的上次使用元数据，以便你保持列表整洁。

目标选择器用于选择 **Gateway**（本地审批）或 **Node**。节点必须公布 `system.execApprovals.get/set`（macOS 应用或无界面节点主机）。如果节点尚未公布 Exec 审批，请直接编辑其本地审批文件。

某些节点主机（包括 Windows 配套应用）使用不同的审批策略格式。Control UI 会以只读方式显示这些主机原生策略。请使用配套应用或通过原生策略格式执行 `openclaw approvals set --node <id|name|ip>` 来编辑它们；请参阅[审批 CLI](/zh-CN/cli/approvals)。

CLI：`openclaw approvals` 支持编辑 Gateway 网关或节点——请参阅
[审批 CLI](/zh-CN/cli/approvals)。

## 审批流程

需要提示时，Gateway 网关会向操作员客户端广播 `exec.approval.requested`。Control UI 和 macOS 应用通过 `exec.approval.resolve` 处理该请求，随后 Gateway 网关会将获批请求转发到节点主机。

对于 `host=node`，审批请求包含规范的 `systemRunPlan` 载荷。Gateway 网关在转发获批的 `system.run` 请求时，会将该计划作为命令/cwd/会话上下文的权威来源：

- 节点 Exec 路径会预先准备一份规范计划。
- 审批记录会存储该计划及其绑定元数据。
- 获批后，最终转发的 `system.run` 调用会复用已存储的计划，而不会信任调用方后续所作的修改。
- 如果调用方在创建审批请求后更改 `command`、`rawCommand`、`cwd`、`agentId` 或 `sessionKey`，Gateway 网关会将转发的运行请求作为审批不匹配而拒绝。

## 系统事件和拒绝

节点报告完成后，Exec 生命周期会向智能体的会话发送一条 `Exec finished` 系统消息。审批获得批准后，OpenClaw 还可以在经过 `tools.exec.approvalRunningNoticeMs` 指定的时间后发出运行中通知（默认值为 `10000`，设为 `0` 可禁用）。Exec 审批被拒绝后，主机命令即进入终止状态：命令不会运行。

- 对于带有来源会话的主智能体异步审批，OpenClaw 会将拒绝作为内部后续消息发回该会话，以便智能体停止等待异步命令，并避免触发结果缺失修复。
- 如果没有会话或无法恢复会话，OpenClaw 仍可向操作员或直接聊天路由报告简短的拒绝消息。
- 子智能体和 cron 会话的拒绝不会发回该会话。

Gateway 网关主机的 Exec 审批会发出相同的完成生命周期事件。受审批控制的 Exec 会复用审批 ID，将待处理请求与其完成/拒绝消息关联起来（`Exec finished (gateway
id=...)` / `Exec denied (gateway id=...)`）。

## 影响

- **`full`** 权限很强；请尽可能优先使用允许列表。
- **`ask`** 能让你掌握操作情况，同时仍可快速批准。
- 按智能体设置的允许列表可防止一个智能体的审批泄漏到其他智能体。
- 审批仅适用于来自**已授权发送方**的主机 Exec 请求。未授权发送方无法发出 `/exec`。
- `/exec security=full` 是面向已授权操作员的会话级便利功能，并且按设计会跳过审批。要硬性阻止主机 Exec，请将审批安全性设置为 `deny`，或通过工具策略拒绝 `exec` 工具。

## 相关内容

<CardGroup cols={2}>
  <Card title="Exec 审批 - 高级用法" href="/zh-CN/tools/exec-approvals-advanced" icon="gear">
    安全二进制文件、解释器绑定，以及将审批转发到聊天。
  </Card>
  <Card title="Exec 工具" href="/zh-CN/tools/exec" icon="terminal">
    Shell 命令执行工具。
  </Card>
  <Card title="提升权限模式" href="/zh-CN/tools/elevated" icon="shield-exclamation">
    同样会跳过审批的紧急突破路径。
  </Card>
  <Card title="沙箱隔离" href="/zh-CN/gateway/sandboxing" icon="box">
    沙箱模式和工作区访问。
  </Card>
  <Card title="安全性" href="/zh-CN/gateway/security" icon="lock">
    安全模型和强化措施。
  </Card>
  <Card title="沙箱、工具策略和提升权限" href="/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    何时使用各项控制措施。
  </Card>
  <Card title="Skills" href="/zh-CN/tools/skills" icon="sparkles">
    基于 Skills 的自动允许行为。
  </Card>
</CardGroup>
