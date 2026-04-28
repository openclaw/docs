---
read_when:
    - 配置执行审批或允许列表
    - 在 macOS 应用中实现执行审批 UX
    - 审查沙箱逃逸提示及其影响
sidebarTitle: Exec approvals
summary: 主机执行审批：策略选项、允许列表，以及 YOLO/strict 工作流
title: 执行审批
x-i18n:
    generated_at: "2026-04-27T00:50:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5e24cda6a1c29dd4e3cc935618473a238f39b1fb880adcf71342524dbbfbdde
    source_path: tools/exec-approvals.md
    workflow: 15
---

执行审批是**配套应用 / 节点主机防护机制**，用于让处于沙箱中的智能体在真实主机（`gateway` 或 `node`）上运行命令。这是一种安全联锁机制：只有当策略 + 允许列表 +（可选的）用户审批全部同意时，命令才会被允许。执行审批会**叠加在**工具策略和 elevated 门控之上（除非 elevated 被设置为 `full`，此时会跳过审批）。

<Note>
生效策略取 `tools.exec.*` 与审批默认值中**更严格**的一方；如果某个审批字段被省略，则使用 `tools.exec` 的值。主机执行还会使用该机器上的本地审批状态——如果 `~/.openclaw/exec-approvals.json` 中主机本地设置了 `ask: "always"`，即使会话或配置默认值请求 `ask: "on-miss"`，仍然会持续提示。
</Note>

## 检查生效策略

| Command                                                          | 显示内容 |
| ---------------------------------------------------------------- | ------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | 请求的策略、主机策略来源，以及最终生效结果。 |
| `openclaw exec-policy show`                                      | 本地机器上的合并视图。 |
| `openclaw exec-policy set` / `preset`                            | 一步将本地请求策略与本地主机审批文件同步。 |

当某个本地作用域请求 `host=node` 时，`exec-policy show` 会在运行时将该作用域报告为由节点管理，而不是假装本地审批文件是真实来源。

如果配套应用 UI **不可用**，任何原本通常会触发提示的请求都会由**询问回退策略**处理（默认：`deny`）。

<Tip>
原生聊天审批客户端可以在待处理审批消息上预置特定渠道的快捷交互。例如，Matrix 会预置反应快捷方式（`✅` 单次允许、`❌` 拒绝、`♾️` 始终允许），同时仍在消息中保留 `/approve ...` 命令作为后备方案。
</Tip>

## 适用位置

执行审批会在执行所在主机本地强制执行：

- **Gateway 网关主机** → Gateway 网关机器上的 `openclaw` 进程。
- **节点主机** → 节点运行器（macOS 配套应用或无头节点主机）。

### 网络模型

- 通过 Gateway 网关认证的调用方被视为该 Gateway 网关的受信任操作员。
- 已配对节点会将这种受信任操作员能力扩展到节点主机。
- 执行审批可以降低意外执行风险，但**不是**按用户划分的认证边界。
- 已批准的节点主机执行会绑定规范化执行上下文：规范化的 cwd、精确的 argv、存在时的环境变量绑定，以及适用时固定的可执行文件路径。
- 对于 shell 脚本和直接的解释器/运行时文件调用，OpenClaw 还会尝试绑定一个具体的本地文件操作数。如果该绑定文件在审批之后、执行之前发生变化，则会拒绝执行，而不是执行已漂移的内容。
- 文件绑定刻意采用尽力而为方式，**不是**对每种解释器/运行时加载路径都提供完整语义模型。如果审批模式无法精确识别并绑定唯一一个具体本地文件，它会拒绝签发基于审批的执行，而不是假装覆盖完整。

### macOS 分层

- **节点主机服务** 会通过本地 IPC 将 `system.run` 转发给 **macOS 应用**。
- **macOS 应用** 在 UI 上下文中执行审批并运行命令。

## 设置与存储

审批存储在执行主机上的本地 JSON 文件中：

```text
~/.openclaw/exec-approvals.json
```

示例结构：

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

## 策略选项

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` — 阻止所有主机执行请求。
  - `allowlist` — 仅允许允许列表中的命令。
  - `full` — 允许所有内容（等同于 elevated）。

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` — 从不提示。
  - `on-miss` — 仅在允许列表不匹配时提示。
  - `always` — 对每条命令都提示。当生效的询问模式为 `always` 时，`allow-always` 的持久信任**不会**抑制提示。

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  当需要提示但没有可达 UI 时的处理方式。

- `deny` — 阻止。
- `allowlist` — 仅在允许列表匹配时允许。
- `full` — 允许。

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  当为 `true` 时，OpenClaw 会将内联代码求值形式视为仅可通过审批执行，即使解释器二进制文件本身已在允许列表中也是如此。这是对无法清晰映射到一个稳定文件操作数的解释器加载路径所做的纵深防御。
</ParamField>

严格模式会捕获的示例：

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

在严格模式下，这些命令仍然需要显式审批，并且 `allow-always` 不会自动为它们持久化新的允许列表条目。

## YOLO 模式（无审批）

如果你希望主机执行在没有审批提示的情况下运行，就必须同时放开**两层**策略——OpenClaw 配置中的请求执行策略（`tools.exec.*`）**以及** `~/.openclaw/exec-approvals.json` 中主机本地的审批策略。

YOLO 是默认的主机行为，除非你明确收紧它：

| 层级                  | YOLO 设置 |
| --------------------- | --------- |
| `tools.exec.security` | 在 `gateway`/`node` 上设为 `full` |
| `tools.exec.ask`      | `off` |
| 主机 `askFallback`    | `full` |

<Warning>
**重要区别：**

- `tools.exec.host=auto` 选择执行**在哪里**运行：有沙箱时在沙箱中，否则在 Gateway 网关上。
- YOLO 选择主机执行**如何**获批：`security=full` 加 `ask=off`。
- 在 YOLO 模式下，OpenClaw **不会**在已配置的主机执行策略之上额外添加单独的启发式命令混淆审批门控或脚本预检拒绝层。
- `auto` 不会让沙箱会话可以免费覆盖为网关路由。允许从 `auto` 发起按次调用的 `host=node` 请求；只有在没有激活沙箱运行时时，才允许从 `auto` 发起 `host=gateway`。如需稳定的非 auto 默认值，请设置 `tools.exec.host` 或显式使用 `/exec host=...`。

</Warning>

公开其自身非交互权限模式的 CLI 支持提供商可以遵循此策略。当 OpenClaw 的请求执行策略为 YOLO 时，Claude CLI 会添加 `--permission-mode bypassPermissions`。你可以通过 `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` 下的显式 Claude 参数覆盖该后端行为——例如 `--permission-mode default`、`acceptEdits` 或 `bypassPermissions`。

如果你想使用更保守的设置，可以将任一层收紧回 `allowlist` / `on-miss` 或 `deny`。

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

这个本地快捷方式会同时更新：

- 本地 `tools.exec.host/security/ask`。
- 本地 `~/.openclaw/exec-approvals.json` 默认值。

它刻意仅作用于本地。若要远程更改 Gateway 网关主机或节点主机审批，请使用 `openclaw approvals set --gateway` 或 `openclaw approvals set --node <id|name|ip>`。

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
- 节点执行审批会在运行时从节点获取，因此面向节点的更新必须使用 `openclaw approvals --node ...`。

</Note>

### 仅当前会话的快捷方式

- `/exec security=full ask=off` 只会更改当前会话。
- `/elevated full` 是一个紧急放行快捷方式，也会跳过该会话的执行审批。

如果主机审批文件仍比配置更严格，较严格的主机策略仍然会生效。

## 允许列表（按智能体）

允许列表是**按智能体**划分的。如果存在多个智能体，请在 macOS 应用中切换你要编辑的智能体。模式使用 glob 匹配。

模式可以是解析后的二进制路径 glob，也可以是裸命令名 glob。裸名称只匹配通过 `PATH` 调用的命令，因此当命令写作 `rg` 时，`rg` 可以匹配 `/opt/homebrew/bin/rg`，但**不能**匹配 `./rg` 或 `/tmp/rg`。如果你只信任某个特定二进制位置，请使用路径 glob。

旧版 `agents.default` 条目会在加载时迁移到 `agents.main`。像 `echo ok && pwd` 这样的 shell 链式命令仍然要求每个顶层片段都满足允许列表规则。

示例：

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

每个允许列表条目都会跟踪：

| Field              | 含义 |
| ------------------ | ---- |
| `id`               | 用于 UI 标识的稳定 UUID |
| `lastUsedAt`       | 最后使用时间戳 |
| `lastUsedCommand`  | 最后一次匹配到的命令 |
| `lastResolvedPath` | 最后解析到的二进制路径 |

## 自动允许 Skills CLI

启用 **Auto-allow skill CLIs** 后，已知 Skills 引用的可执行文件会在节点上（macOS 节点或无头节点主机）被视为已加入允许列表。该功能通过 Gateway 网关 RPC 使用 `skills.bins` 获取 skill 二进制列表。如果你想要严格的手动允许列表，请禁用它。

<Warning>
- 这是一个**隐式的便捷允许列表**，独立于手动路径允许列表条目。
- 它适用于 Gateway 网关与节点处于同一信任边界内的受信任操作员环境。
- 如果你需要严格的显式信任，请保持 `autoAllowSkills: false`，并仅使用手动路径允许列表条目。

</Warning>

## 安全二进制与审批转发

有关安全二进制（仅 stdin 的快速路径）、解释器绑定细节，以及如何将审批提示转发到 Slack/Discord/Telegram（或将它们作为原生审批客户端运行），请参阅
[执行审批——高级](/zh-CN/tools/exec-approvals-advanced)。

## 在 Control UI 中编辑

使用 **Control UI → Nodes → Exec approvals** 卡片来编辑默认值、按智能体覆盖项和允许列表。选择一个作用域（默认值或某个智能体），调整策略，添加/删除允许列表模式，然后点击 **Save**。UI 会显示每个模式的最后使用元数据，便于你保持列表整洁。

目标选择器可选择 **Gateway 网关**（本地审批）或某个**节点**。节点必须声明 `system.execApprovals.get/set`（macOS 应用或无头节点主机）。如果某个节点尚未声明执行审批，请直接编辑它本地的 `~/.openclaw/exec-approvals.json`。

CLI：`openclaw approvals` 支持编辑网关或节点——参见
[Approvals CLI](/zh-CN/cli/approvals)。

## 审批流程

当需要提示时，网关会向操作员客户端广播
`exec.approval.requested`。Control UI 和 macOS 应用通过 `exec.approval.resolve` 进行处理，然后网关将已批准的请求转发到节点主机。

对于 `host=node`，审批请求会包含规范化的 `systemRunPlan` 负载。网关在转发已批准的 `system.run` 请求时，会将该计划作为权威的命令/cwd/会话上下文。

这对于异步审批延迟很重要：

- 节点执行路径会预先准备一份规范化计划。
- 审批记录会存储该计划及其绑定元数据。
- 一旦获批，最终转发的 `system.run` 调用会复用已存储的计划，而不是信任调用方后续的修改。
- 如果在创建审批请求后，调用方更改了 `command`、`rawCommand`、`cwd`、`agentId` 或 `sessionKey`，网关会因审批不匹配而拒绝转发执行。

## 系统事件

执行生命周期会显示为系统消息：

- `Exec running`（仅当命令超过运行通知阈值时）。
- `Exec finished`。
- `Exec denied`。

这些消息会在节点报告事件后发布到该智能体的会话中。Gateway 网关主机执行审批在命令完成时也会发出相同的生命周期事件（如果运行时间超过阈值，也可选择在运行中发出）。受审批控制的执行会在这些消息中复用审批 id 作为 `runId`，便于关联。

## 审批被拒绝时的行为

当异步执行审批被拒绝时，OpenClaw 会阻止智能体在该会话中复用此前同一命令任意一次运行的输出。拒绝原因会连同明确说明一起传递，指出当前没有可用的命令输出，从而防止智能体声称有新输出，或用先前成功运行留下的过期结果重复已被拒绝的命令。

## 影响

- **`full`** 权限很强；如有可能，优先使用允许列表。
- **`ask`** 让你保持在审批流程中，同时仍可快速批准。
- 按智能体划分的允许列表可防止某个智能体的审批泄漏到其他智能体。
- 审批仅适用于来自**已授权发送方**的主机执行请求。未授权发送方不能发出 `/exec`。
- `/exec security=full` 是面向已授权操作员的会话级便捷方式，并且按设计会跳过审批。若要强制阻止主机执行，请将审批安全级别设为 `deny`，或通过工具策略拒绝 `exec` 工具。

## 相关内容

<CardGroup cols={2}>
  <Card title="执行审批——高级" href="/zh-CN/tools/exec-approvals-advanced" icon="gear">
    安全二进制、解释器绑定，以及将审批转发到聊天。
  </Card>
  <Card title="Exec 工具" href="/zh-CN/tools/exec" icon="terminal">
    Shell 命令执行工具。
  </Card>
  <Card title="Elevated mode" href="/zh-CN/tools/elevated" icon="shield-exclamation">
    也会跳过审批的紧急放行路径。
  </Card>
  <Card title="沙箱隔离" href="/zh-CN/gateway/sandboxing" icon="box">
    沙箱模式和工作区访问。
  </Card>
  <Card title="安全" href="/zh-CN/gateway/security" icon="lock">
    安全模型与加固。
  </Card>
  <Card title="沙箱隔离 vs 工具策略 vs elevated" href="/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    何时应使用哪种控制方式。
  </Card>
  <Card title="Skills" href="/zh-CN/tools/skills" icon="sparkles">
    由 Skill 支持的自动允许行为。
  </Card>
</CardGroup>
